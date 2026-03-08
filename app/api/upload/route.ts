import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { insertCone, updateConeAnalysis, getConeById } from '@/lib/db';
import { analyzeCone } from '@/lib/claude';
import { searchSpotifyTrack } from '@/lib/spotify';
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

  // Analyze with Claude (use original buffer for analysis for best quality)
  try {
    const analysis = await analyzeCone(buffer, mimeType);

    let spotifyTrackId: string | null = null;
    if (!analysis.is_impostor && analysis.song) {
      spotifyTrackId = await searchSpotifyTrack(
        analysis.song.title,
        analysis.song.artist
      );
    }

    const defaultTrackId = '7glKwbR1DyuIuE6XvZvJbQ';
    const defaultSongTitle = '#3';
    const defaultSongArtist = 'Aphex Twin';

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
      song_title: analysis.song?.title ?? defaultSongTitle,
      song_artist: analysis.song?.artist ?? defaultSongArtist,
      spotify_track_id: spotifyTrackId ?? defaultTrackId,
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
