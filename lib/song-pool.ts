/**
 * Song pool by SLOAN (Big Five) type.
 * Add your own songs: key = 5-letter SLOAN code (e.g. "RLUAI"), value = array of { spotify_track_id, song_title, song_artist }.
 * When a cone is assigned a SLOAN type, a song is picked at random from that category.
 */

export interface SongEntry {
  spotify_track_id: string;
  song_title: string;
  song_artist: string;
}

/** Songs per SLOAN type. Edit this object to add your songs. Default song in each until you replace. */
export const SONGS_BY_SLOAN: Record<string, SongEntry[]> = {
  SCOAI: [
    { spotify_track_id: '3FzK2g50oLcx8vqETwOn07', song_title: 'Love Songs on the Radio', song_artist: 'Mojave 3' }
  ],
  SCOAN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SCOEI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SCOEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SCUAI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SCUAN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SCUEI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SCUEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SLOAI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SLOAN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SLOEI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SLOEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SLUAI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  SLUAN: [
    { spotify_track_id: '2lnbMcp6u9GN1WbU0e2Hqu', song_title: 'Shadows of the Dark', song_artist: 'Gizmo Varillas' }
  ],
  SLUEI: [
    { spotify_track_id: '0G9slHEyeAOmLnC2ub7yCw', song_title: 'Semper Augustus', song_artist: 'Fayzz' }
  ],
  SLUEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RCOAI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RCOAN: [
    { spotify_track_id: '3PVpNrXCygTsubaBt6O6Rn', song_title: 'Yoyo', song_artist: 'Parsley Sound' }
  ],
  RCOEI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RCOEN: [
    { spotify_track_id: '3pAlKMwng8S0zlKL71glZD', song_title: 'Odyssey', song_artist: 'Rival Consoles' }
  ],
  RCUAI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RCUAN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RCUEI: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RCUEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RLOAI: [
    { spotify_track_id: '3JEZsNaO2MkUfW4EliIPkH', song_title: 'First Breath After Coma', song_artist: 'Explosions in The Sky' }
  ],
  RLOAN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RLOEI: [
    { spotify_track_id: '1MPtLlyuB1X78TeammWxy9', song_title: 'The Beginning of the End', song_artist: 'Headache' }
  ],
  RLOEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RLUAI: [
    { spotify_track_id: '5NFZLpFoP4fVWjmc007A5k', song_title: 'We Have A Map Of The Piano', song_artist: 'múm' }
  ],
  RLUAN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
  RLUEI: [
    { spotify_track_id: '38KFHXttkrIpnUd0tTvkZj', song_title: 'Creature, Pt.1', song_artist: 'DjRUM' }
  ],
  RLUEN: [
    { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' }
  ],
};

/** Default songs when SLOAN is missing or category has no entries. Add more to this array to have the system pick randomly. */
const DEFAULT_SONGS: SongEntry[] = [
  { spotify_track_id: '7glKwbR1DyuIuE6XvZvJbQ', song_title: '#3', song_artist: 'Aphex Twin' },
  // Add more defaults here, e.g.:
  // { spotify_track_id: 'TRACK_ID', song_title: 'Title', song_artist: 'Artist' },
];

/** Pick a random song for the given SLOAN code. Falls back to a random DEFAULT_SONGS entry if category missing or empty. */
export function getSongForSloan(sloan: string | null | undefined): SongEntry {
  if (!sloan || typeof sloan !== 'string') return pickDefault();
  const key = sloan.trim().toUpperCase();
  const list = SONGS_BY_SLOAN[key];
  if (!list || list.length === 0) return pickDefault();
  return list[Math.floor(Math.random() * list.length)];
}

function pickDefault(): SongEntry {
  if (DEFAULT_SONGS.length === 0) {
    return { spotify_track_id: '', song_title: '—', song_artist: '—' };
  }
  return DEFAULT_SONGS[Math.floor(Math.random() * DEFAULT_SONGS.length)];
}
