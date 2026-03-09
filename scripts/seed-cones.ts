/**
 * Seed cones from images in the assets/ folder.
 * Resizes each image, uploads to Supabase Storage, inserts a cone, runs AI analysis.
 *
 * Prerequisites:
 * - Create assets/ in project root and add your cone images (e.g. image-1.png, image-2.png, ...).
 * - .env.local with SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.
 * - Supabase Storage bucket "cones" created and set to Public.
 *
 * Run: npm run seed
 */

import path from 'path';
import fs from 'fs';

// Load .env.local by reading the file and setting process.env (works when run via tsx)
function loadEnvLocal() {
  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'cones', '.env.local'),
    path.join(path.dirname(process.argv[1] || __dirname), '..', '.env.local'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    return candidates;
  }
  return candidates;
}
const envCandidates = loadEnvLocal();

const SEED_SESSION_ID = '__seed__';
const ASSETS_DIR = path.join(process.cwd(), 'assets');

async function main() {
  if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Missing Supabase config. In the project root (cones/), create or edit .env.local with:');
    console.error('  SUPABASE_URL=https://your-project.supabase.co');
    console.error('  SUPABASE_ANON_KEY=your_anon_key   (or SUPABASE_SERVICE_ROLE_KEY=your_service_role_key)');
    console.error('Tried loading from:', envCandidates.filter((p) => fs.existsSync(p)));
    process.exit(1);
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('Create an "assets" folder in the project root and add your cone images (e.g. image-1.png, image-2.png).');
    process.exit(1);
  }

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter(
      (f) =>
        f.endsWith('.png') ||
        f.endsWith('.jpg') ||
        f.endsWith('.jpeg') ||
        f.endsWith('.webp')
    )
    .sort();

  if (files.length === 0) {
    console.error('No .png, .jpg, .jpeg, or .webp files found in assets/.');
    process.exit(1);
  }

  console.log(`Found ${files.length} images. Resizing, uploading to Supabase Storage, and creating cones...\n`);

  const { v4: uuidv4 } = await import('uuid');
  const { resizeImage } = await import('../lib/image-resize');
  const { uploadImageToStorage } = await import('../lib/storage');
  const {
    insertCone,
    updateConeAnalysis,
    getConeById,
  } = await import('../lib/db');
  const { analyzeCone } = await import('../lib/claude');
  const { getSongForSloan } = await import('../lib/song-pool');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(ASSETS_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const mimeType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';

    console.log(`[${i + 1}/${files.length}] ${file}`);

    const buffer = fs.readFileSync(filePath);
    const { buffer: resizedBuffer, mimeType: outMimeType } = await resizeImage(
      buffer,
      mimeType
    );

    const id = uuidv4();
    const storageFilename = `${id}.jpg`;

    const imagePath = await uploadImageToStorage(
      storageFilename,
      resizedBuffer,
      outMimeType
    );

    await insertCone({
      id,
      session_id: SEED_SESSION_ID,
      image_path: imagePath,
    });

    try {
      const analysis = await analyzeCone(buffer, mimeType);
      const song = getSongForSloan(analysis.sloan ?? null);

      await updateConeAnalysis(id, {
        description: analysis.description,
        location: analysis.location,
        about: analysis.about,
        openness: analysis.big_five?.openness ?? null,
        conscientiousness: analysis.big_five?.conscientiousness ?? null,
        extraversion: analysis.big_five?.extraversion ?? null,
        agreeableness: analysis.big_five?.agreeableness ?? null,
        neuroticism: analysis.big_five?.neuroticism ?? null,
        core_values: analysis.core_values ?? [],
        song_title: song.song_title,
        song_artist: song.song_artist,
        spotify_track_id: song.spotify_track_id,
        sloan: analysis.sloan ?? null,
        is_impostor: analysis.is_impostor ? 1 : 0,
      });

      const cone = await getConeById(id);
      console.log(`   → ${cone?.description ?? '—'}`);
    } catch (err) {
      console.error(`   Analysis failed:`, err);
    }
  }

  console.log(`\nDone. ${files.length} cones added to Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
