/**
 * Song pool by SLOAN (Big Five) type.
 * Uses Bandcamp-style fields, but `song_url` currently points to a shared Spotify track:
 * https://open.spotify.com/track/7glKwbR1DyuIuE6XvZvJbQ?si=04c64ca3a2004393
 */

export interface SongEntry {
  song_title: string;
  song_artist: string;
  song_url: string | null;
  bandcamp_album_id: string | null;
  bandcamp_track_id: string | null;
}

const DEFAULT_SONG_URL =
  'https://open.spotify.com/track/7glKwbR1DyuIuE6XvZvJbQ?si=04c64ca3a2004393';
const DEFAULT_BANDCAMP_ALBUM_ID = '964967358';
const DEFAULT_BANDCAMP_TRACK_ID = '2156376676';

/** Songs per SLOAN type. Edit this object to add your songs. */
export const SONGS_BY_SLOAN: Record<string, SongEntry[]> = {
  SCOAI: [
    {
      song_title: 'Love Songs on the Radio',
      song_artist: 'Mojave 3',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCOAN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCOEI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCOEN: [
    {
      song_title: 'Esperanza',
      song_artist: 'Hermanos Gutiérrez',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCUAI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCUAN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCUEI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SCUEN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SLOAI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SLOAN: [
    {
      song_title: 'Silhouettes (I, II & III)',
      song_artist: 'Floating Points',
      song_url: 'https://open.spotify.com/track/2D4VTAyHTFegKvcw9oRZhX?si=b6058e5a898b4fcc',
      bandcamp_album_id: '960919289',
      bandcamp_track_id: '4103986364',
    },
  ],
  SLOEI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SLOEN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SLUAI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SLUAN: [
    {
      song_title: 'Shadows of the Dark',
      song_artist: 'Gizmo Varillas',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  SLUEI: [
    {
      song_title: 'Semper Augustus',
      song_artist: 'Fayzz',
      song_url: 'https://open.spotify.com/track/0G9slHEyeAOmLnC2ub7yCw?si=9f8ea8c10ace4939',
      bandcamp_album_id: '3310563316',
      bandcamp_track_id: '1262975051',
    },
  ],
  SLUEN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RCOAI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RCOAN: [
    {
      song_title: 'CREEK',
      song_artist: 'Hiroshi Yoshimura',
      song_url: 'https://open.spotify.com/track/7yDfMUfkN5qfaj5gTbqwuK?si=e2e5e7e89d4d4a89',
      bandcamp_album_id: '2915646406',
      bandcamp_track_id: '3550477222',
    },
  ],
  RCOEI: [
    {
      song_title: 'A Gallant Gentleman',
      song_artist: 'We Lost The Sea',
      song_url: 'https://open.spotify.com/track/7MZM9KhwGQG8QJ4BycsnQn?si=b11fe18eb6ce4eb0',
      bandcamp_album_id: '3408776844',
      bandcamp_track_id: '1397131464',
    },
  ],
  RCOEN: [
    {
      song_title: 'Odyssey',
      song_artist: 'Rival Consoles',
      song_url: 'https://open.spotify.com/track/3pAlKMwng8S0zlKL71glZD?si=9c1f5396f6ba4a49',
      bandcamp_album_id: '1526230073',
      bandcamp_track_id: '245253247',
    },
  ],
  RCUAI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RCUAN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RCUEI: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RCUEN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RLOAI: [
    {
      song_title: 'First Breath After Coma',
      song_artist: 'Explosions in The Sky',
      song_url: 'https://open.spotify.com/track/3JEZsNaO2MkUfW4EliIPkH?si=2a5ecaa2e85248d7',
      bandcamp_album_id: '3044203691',
      bandcamp_track_id: '2737115574',
    },
  ],
  RLOAN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RLOEI: [
    {
      song_title: 'Bullet Proof... I Wish I Was',
      song_artist: 'Radiohead',
      song_url: 'https://open.spotify.com/track/5XuU9htN358NTMCcqRvfDV?si=ec63f16ae2ac4692',
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RLOEN: [
    {
      song_title: 'The Beginning of the End',
      song_artist: 'Headache',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RLUAI: [
    {
      song_title: 'We Have A Map Of The Piano',
      song_artist: 'múm',
      song_url: 'https://open.spotify.com/track/5NFZLpFoP4fVWjmc007A5k?si=0e35493bb37748ef',
      bandcamp_album_id: '912600713',
      bandcamp_track_id: '2797720846',
    },
  ],
  RLUAN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
  RLUEI: [
    {
      song_title: 'Creature, Pt.1',
      song_artist: 'DjRUM',
      song_url: 'https://open.spotify.com/track/38KFHXttkrIpnUd0tTvkZj?si=28cd11fb00684311',
      bandcamp_album_id: '2405195433',
      bandcamp_track_id: '641383633',
    },
  ],
  RLUEN: [
    {
      song_title: '#3',
      song_artist: 'Aphex Twin',
      song_url: DEFAULT_SONG_URL,
      bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
      bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
    },
  ],
};

/** Default songs when SLOAN is missing or category has no entries. */
const DEFAULT_SONGS: SongEntry[] = [
  {
    song_title: '#3',
    song_artist: 'Aphex Twin',
    song_url: DEFAULT_SONG_URL,
    bandcamp_album_id: DEFAULT_BANDCAMP_ALBUM_ID,
    bandcamp_track_id: DEFAULT_BANDCAMP_TRACK_ID,
  },
];

/** Pick a random song for the given SLOAN code. Falls back to DEFAULT_SONGS if category missing or empty. */
export function getSongForSloan(sloan: string | null | undefined): SongEntry {
  if (!sloan || typeof sloan !== 'string') return pickDefault();
  const key = sloan.trim().toUpperCase();
  const list = SONGS_BY_SLOAN[key];
  if (!list || list.length === 0) return pickDefault();
  return list[Math.floor(Math.random() * list.length)];
}

function pickDefault(): SongEntry {
  if (DEFAULT_SONGS.length === 0) {
    return { song_title: '—', song_artist: '—', song_url: null, bandcamp_album_id: null, bandcamp_track_id: null };
  }
  return DEFAULT_SONGS[Math.floor(Math.random() * DEFAULT_SONGS.length)];
}
