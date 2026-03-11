import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { insertCone, updateConeAnalysis, getConeById } from '@/lib/db';
import { analyzeCone } from '@/lib/claude';
import { analyzeConeWithGemini } from '@/lib/gemini';
import { getSongForSloan } from '@/lib/song-pool';
import { resizeImage } from '@/lib/image-resize';
import { uploadImageToStorage } from '@/lib/storage';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('image') as File | null;
  const sessionId = (formData.get('session_id') as string) || 'anonymous';

  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || 'image/jpeg';

  // Resize to keep file size down
  const { buffer: resizedBuffer, mimeType: outMimeType } = await resizeImage(
    buffer,
    mimeType
  );

  const id = uuidv4();
  const ext = outMimeType === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `${id}.${ext}`;
  let imagePath: string;

  const useSupabaseStorage =
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (useSupabaseStorage) {
    try {
      imagePath = await uploadImageToStorage(
        filename,
        resizedBuffer,
        outMimeType
      );
    } catch (err) {
      console.error('Supabase Storage upload failed:', err);
      return NextResponse.json(
        { error: 'Image upload failed. Check Storage bucket "cones" exists and is public.' },
        { status: 500 }
      );
    }
  } else {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), resizedBuffer);
    imagePath = `/uploads/${filename}`;
  }

  // Insert placeholder
  await insertCone({ id, session_id: sessionId, image_path: imagePath });

  // Analyze with Gemini when key is set; otherwise use mock data only (no Claude)
  try {
    const analysis = process.env.GEMINI_API_KEY
      ? await analyzeConeWithGemini(buffer, mimeType)
      : await analyzeCone(buffer, mimeType);

    const song = getSongForSloan(analysis.sloan ?? null);

    await updateConeAnalysis(id, {
      description: analysis.description,
      location: null,
      about: analysis.about,
      openness: analysis.big_five?.openness ?? null,
      conscientiousness: analysis.big_five?.conscientiousness ?? null,
      extraversion: analysis.big_five?.extraversion ?? null,
      agreeableness: analysis.big_five?.agreeableness ?? null,
      neuroticism: analysis.big_five?.neuroticism ?? null,
      core_values: analysis.core_values ?? [],
      song_title: song.song_title,
      song_artist: song.song_artist,
      spotify_track_id: null,
      song_url: song.song_url ?? null,
      bandcamp_album_id: song.bandcamp_album_id ?? null,
      bandcamp_track_id: song.bandcamp_track_id ?? null,
      sloan: analysis.sloan ?? null,
      is_impostor: analysis.is_impostor ? 1 : 0,
    });

    const cone = await getConeById(id);
    return NextResponse.json({ cone });
  } catch (err) {
    console.error('Analysis error:', err);
    const cone = await getConeById(id);
    return NextResponse.json(
      { cone, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
