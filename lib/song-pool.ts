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
      song_title: 'Setting Sun',
      song_artist: "You'll Never Get to Heaven",
      song_url: 'https://open.spotify.com/track/2D1rYPinUnikGU9xNWylnN?si=c816dc3cc1b34e65',
      bandcamp_album_id: '3163955389',
      bandcamp_track_id: '2486194412',
    },
  ],
  SCOAN: [
    {
      song_title: 'Angels',
      song_artist: 'Dark Sky',
      song_url: 'https://open.spotify.com/track/0ZrpYZAJWku0zk4i0WVXUT?si=4380c72e0b3343b4',
      bandcamp_album_id: '2565034872',
      bandcamp_track_id: '604283333',
    },
  ],
  SCOEI: [
    {
      song_title: 'The Sun In A Box',
      song_artist: 'Max Cooper',
      song_url: 'https://open.spotify.com/track/7MlkDsu20cng48iJDHAIdu?si=aa987872a3264903',
      bandcamp_album_id: '3375445042',
      bandcamp_track_id: '1667357508',
    },
  ],
  SCOEN: [
    {
      song_title: 'Mariella',
      song_artist: 'Khruangbin',
      song_url: 'https://open.spotify.com/track/3dvXRk7TZ929m21p49RR5P?si=98a0dc2f820e482d',
      bandcamp_album_id: '3372930174',
      bandcamp_track_id: '3697806764',
    },
  ],
  SCUAI: [
    {
      song_title: 'People On Sunday',
      song_artist: 'Domenique Dumont',
      song_url: 'https://open.spotify.com/track/5GY0OnbXEa7rMivlDo13Xl?si=138415422741457d',
      bandcamp_album_id: '2248662711',
      bandcamp_track_id: '3702294995',
    },
  ],
  SCUAN: [
    {
      song_title: 'May Ninth',
      song_artist: 'Khruangbin',
      song_url: 'https://open.spotify.com/track/5yVGW2o9LXaiiS4I3HUM3k?si=d3823ec57fb94709',
      bandcamp_album_id: '1836174753',
      bandcamp_track_id: '2975778349',
    },
  ],
  SCUEI: [
    {
      song_title: 'DRIFTIN',
      song_artist: 'cero',
      song_url: 'https://open.spotify.com/track/4IwsUSXKvMQaASN57Lx9YA?si=3b4c255e16454a80',
      bandcamp_album_id: '919794862',
      bandcamp_track_id: '3258722672',
    },
  ],
  SCUEN: [
    {
      song_title: 'The Message',
      song_artist: 'Still Corners',
      song_url: 'https://open.spotify.com/track/0i5r3EWZsCMYRrpUy8YofZ?si=c1bbe69448d641f9',
      bandcamp_album_id: '2744019647',
      bandcamp_track_id: '3488925024',
    },
  ],
  SLOAI: [
    {
      song_title: 'El Invento',
      song_artist: 'José González',
      song_url: 'https://open.spotify.com/track/7daItyBA4UqHyFItCVgzBn?si=19b7d20e7e9f4386',
      bandcamp_album_id: '3951673169',
      bandcamp_track_id: '1542568182',
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
      song_title: 'Train',
      song_artist: 'Younger Brother',
      song_url: 'https://open.spotify.com/track/2AACF7qh9u5qWxxLyHhwSd?si=8bbeca00158d427b',
      bandcamp_album_id: '1471314279',
      bandcamp_track_id: '1561012384',
    },
  ],
  SLOEN: [
    {
      song_title: 'Blankenship',
      song_artist: 'DIIV',
      song_url: 'https://open.spotify.com/track/2ZKkGDjImEoTafrLyZHjlp?si=f9ca0eec99754344',
      bandcamp_album_id: '2562883581',
      bandcamp_track_id: '2967606620',
    },
  ],
  SLUAI: [
    {
      song_title: 'LONELINESS WILL SHINE',
      song_artist: 'toe',
      song_url: 'https://open.spotify.com/track/3Vz7rPtKueXG50yCFOwYOw?si=04ee9073e4084341',
      bandcamp_album_id: '2491042928',
      bandcamp_track_id: '1817555552',
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
      song_title: 'Bizancio',
      song_artist: 'Toundra',
      song_url: 'https://open.spotify.com/track/2z7PSpbg0pwn6ViCkkh22y?si=3e20334a16ab4a1b',
      bandcamp_album_id: '1451402688',
      bandcamp_track_id: '1793783547',
    },
  ],
  RCOAI: [
    {
      song_title: 'Svefn-g-englar',
      song_artist: 'Sigur Rós',
      song_url: 'https://open.spotify.com/track/07eGxuz8bL6QMsRqEe1Adu?si=06e152b0b66a42ab',
      bandcamp_album_id: '3887486471',
      bandcamp_track_id: '1683135875',
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
      song_title: 'Kettering',
      song_artist: 'The Antlers',
      song_url: 'https://open.spotify.com/track/453spNn4mGdYErYt3rGhSX?si=75bfe6188a5d4083',
      bandcamp_album_id: '1914003110',
      bandcamp_track_id: '50036698',
    },
  ],
  RCUAN: [
    {
      song_title: 'Loro',
      song_artist: 'Pinback',
      song_url: 'https://open.spotify.com/track/05jpJBvKKsOpFGqw1uDnZ7?si=42e5d53b9c5f4d4d',
      bandcamp_album_id: '3421850132',
      bandcamp_track_id: '2970761491',
    },
  ],
  RCUEI: [
    {
      song_title: 'A Tune For Us',
      song_artist: 'DjRUM',
      song_url: 'https://open.spotify.com/track/41Y0ch6R3jzpJOZv6nhf9Z?si=c24f6101267e48c8',
      bandcamp_album_id: '2022816946',
      bandcamp_track_id: '2778319625',
    },
  ],
  RCUEN: [
    {
      song_title: 'Rioseco',
      song_artist: 'Caspian',
      song_url: 'https://open.spotify.com/track/42wOySSV3mE3lSo12wKbmL?si=3ab84183884f488d',
      bandcamp_album_id: '801960894',
      bandcamp_track_id: '1914289141',
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
      song_title: 'Free In The Knowledge',
      song_artist: 'The Smile',
      song_url: 'https://open.spotify.com/track/0p8esvsm33EFp9iABb8wH9?si=2ef1b4acc04e4984',
      bandcamp_album_id: '1268189226',
      bandcamp_track_id: '3341455344',
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
      song_title: 'Levo',
      song_artist: 'Recondite',
      song_url: 'https://open.spotify.com/track/1Xgg0bhjK57PJ6WLYOi3oY?si=83a8caa39de44a3b',
      bandcamp_album_id: '1743284557',
      bandcamp_track_id: '1757747814',
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
      song_title: 'Falling Ashes',
      song_artist: 'Slowdive',
      song_url: 'https://open.spotify.com/track/4EocLlVV582YshaT7aXZxR?si=c9cbaace6fdb469e',
      bandcamp_album_id: '2948336751',
      bandcamp_track_id: '1355050415',
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
      song_title: 'These Chains',
      song_artist: 'Mid-Air Thief',
      song_url: 'https://open.spotify.com/track/15X2S6zycG5gc9ja86361z?si=bd4edb4ee2d74760',
      bandcamp_album_id: '303635167',
      bandcamp_track_id: '431797831',
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
