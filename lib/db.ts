import { supabase } from './supabase';

export interface ConeRow {
  id: string;
  session_id: string;
  image_path: string;
  description: string | null;
  location: string | null;
  about: string | null;
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
  core_values: string[] | null;
  song_title: string | null;
  song_artist: string | null;
  song_url: string | null;
  bandcamp_album_id: string | null;
  bandcamp_track_id: string | null;
  sloan: string | null;
  is_impostor: number;
  is_analyzed: number;
  created_at: string;
}

export interface Cone extends Omit<ConeRow, 'core_values'> {
  core_values: string[];
  index: number;
}

function parseRow(row: ConeRow, index: number): Cone {
  return {
    ...row,
    core_values: Array.isArray(row.core_values) ? row.core_values : [],
    index,
  };
}

const CONES_SELECT =
  'id, session_id, image_path, description, location, about, openness, conscientiousness, extraversion, agreeableness, neuroticism, core_values, song_title, song_artist, song_url, bandcamp_album_id, bandcamp_track_id, sloan, is_impostor, is_analyzed, created_at';

export async function getAllCones(): Promise<Cone[]> {
  const { data: rows, error } = await supabase
    .from('cones')
    .select(CONES_SELECT)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (rows ?? []).map((r, i) => parseRow(r as ConeRow, i + 1));
}

export async function getMyCones(sessionId: string): Promise<Cone[]> {
  const { data: rows, error } = await supabase
    .from('cones')
    .select(CONES_SELECT)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (rows ?? []).map((r, i) => parseRow(r as ConeRow, i + 1));
}

export async function getConeById(id: string): Promise<Cone | null> {
  const { data: row, error } = await supabase
    .from('cones')
    .select(CONES_SELECT)
    .eq('id', id)
    .single();

  if (error || !row) return null;

  const { data: ordered } = await supabase
    .from('cones')
    .select('id')
    .order('created_at', { ascending: true });
  const idx = (ordered ?? []).findIndex((r) => r.id === id);
  return parseRow(row as ConeRow, idx >= 0 ? idx + 1 : 1);
}

export async function insertCone(data: {
  id: string;
  session_id: string;
  image_path: string;
}): Promise<void> {
  const { error } = await supabase.from('cones').insert({
    id: data.id,
    session_id: data.session_id,
    image_path: data.image_path,
  });
  if (error) throw error;
}

export async function updateConeAnalysis(
  id: string,
  data: {
    description: string | null;
    location: string | null;
    about: string | null;
    openness: number | null;
    conscientiousness: number | null;
    extraversion: number | null;
    agreeableness: number | null;
    neuroticism: number | null;
    core_values: string[];
    song_title: string | null;
    song_artist: string | null;
    song_url: string | null;
    bandcamp_album_id: string | null;
    bandcamp_track_id: string | null;
    sloan: string | null;
    is_impostor: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('cones')
    .update({
      description: data.description,
      location: data.location,
      about: data.about,
      openness: data.openness,
      conscientiousness: data.conscientiousness,
      extraversion: data.extraversion,
      agreeableness: data.agreeableness,
      neuroticism: data.neuroticism,
      core_values: data.core_values,
      song_title: data.song_title,
      song_artist: data.song_artist,
      song_url: data.song_url,
      bandcamp_album_id: data.bandcamp_album_id,
      bandcamp_track_id: data.bandcamp_track_id,
      sloan: data.sloan,
      is_impostor: data.is_impostor,
      is_analyzed: 1,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCone(
  id: string,
  sessionId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('cones')
    .delete()
    .eq('id', id)
    .eq('session_id', sessionId)
    .select('id');

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function countAllCones(): Promise<number> {
  const { count, error } = await supabase
    .from('cones')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function restoreCone(cone: Cone): Promise<void> {
  const { error } = await supabase.from('cones').insert({
    id: cone.id,
    session_id: cone.session_id,
    image_path: cone.image_path,
    description: cone.description,
    location: cone.location,
    about: cone.about,
    openness: cone.openness,
    conscientiousness: cone.conscientiousness,
    extraversion: cone.extraversion,
    agreeableness: cone.agreeableness,
    neuroticism: cone.neuroticism,
      core_values: cone.core_values,
      song_title: cone.song_title,
      song_artist: cone.song_artist,
      song_url: cone.song_url,
    bandcamp_album_id: cone.bandcamp_album_id,
    bandcamp_track_id: cone.bandcamp_track_id,
    sloan: cone.sloan,
    is_impostor: cone.is_impostor,
    is_analyzed: cone.is_analyzed,
    created_at: cone.created_at,
  });
  if (error) throw error;
}
