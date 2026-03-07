import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { insertCone, updateConeAnalysis, getConeById } from '@/lib/db';
import { analyzeCone } from '@/lib/claude';
import { searchSpotifyTrack } from '@/lib/spotify';

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

  // Save file
  const id = uuidv4();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${id}.${ext}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  await mkdir(uploadsDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(uploadsDir, filename), buffer);

  const imagePath = `/uploads/${filename}`;

  // Insert placeholder
  insertCone({ id, session_id: sessionId, image_path: imagePath });

  // Analyze with Claude
  try {
    const mimeType = file.type || 'image/jpeg';
    const analysis = await analyzeCone(buffer, mimeType);

    let spotifyTrackId: string | null = null;
    if (!analysis.is_impostor && analysis.song) {
      spotifyTrackId = await searchSpotifyTrack(
        analysis.song.title,
        analysis.song.artist
      );
    }

    updateConeAnalysis(id, {
      description: analysis.description,
      location: analysis.location,
      about: analysis.about,
      openness: analysis.big_five?.openness ?? null,
      conscientiousness: analysis.big_five?.conscientiousness ?? null,
      extraversion: analysis.big_five?.extraversion ?? null,
      agreeableness: analysis.big_five?.agreeableness ?? null,
      neuroticism: analysis.big_five?.neuroticism ?? null,
      core_values: analysis.core_values ?? [],
      song_title: analysis.song?.title ?? null,
      song_artist: analysis.song?.artist ?? null,
      spotify_track_id: spotifyTrackId,
      is_impostor: analysis.is_impostor ? 1 : 0,
    });

    const cone = getConeById(id);
    return NextResponse.json({ cone });
  } catch (err) {
    console.error('Analysis error:', err);
    // Return partial cone so client can handle gracefully
    const cone = getConeById(id);
    return NextResponse.json(
      { cone, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
