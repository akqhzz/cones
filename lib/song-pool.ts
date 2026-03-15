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
    {
      song_title: 'Between The Buttons',
      song_artist: "French 79",
      song_url: 'https://open.spotify.com/track/1RaOOqtnsjJ7FjrL35ii8p?si=e4149beb77ec4be6',
      bandcamp_album_id: '1845986737',
      bandcamp_track_id: '2127631876',
    },
    {
      song_title: 'Tunnel',
      song_artist: "Bad Math",
      song_url: 'https://open.spotify.com/track/368kriNcdTEr15yhK5wStz?si=ca326af00e95497f',
      bandcamp_album_id: '82968525',
      bandcamp_track_id: '4128519920',
    },
    {
      song_title: 'Advanced Falconry',
      song_artist: "Mutual Benefit",
      song_url: 'https://open.spotify.com/track/6aA2LcC91SFaRgz0jPXZIa?si=6038cfd4fd6f4807',
      bandcamp_album_id: '3678151605',
      bandcamp_track_id: '2873561426',
    },
    {
      song_title: 'Should Have Known Better',
      song_artist: "Sufjan Stevens",
      song_url: 'https://open.spotify.com/track/3AyuigFWbuirWHvidbMz8O?si=0a0bdead35c743cb',
      bandcamp_album_id: '1891263657',
      bandcamp_track_id: '3531678523',
    },
    {
      song_title: 'Franz Kafka at the Zoo',
      song_artist: "The Clean",
      song_url: 'https://open.spotify.com/track/6lapVjn3EjBGS5m2r17h0x?si=21e43daf50fe47bf',
      bandcamp_album_id: '3876886178',
      bandcamp_track_id: '724723845',
    },
    {
      song_title: 'Run Out',
      song_artist: "Deep Water",
      song_url: 'https://open.spotify.com/track/0QgK0z0aGPzX0ycz7Nyfjw?si=d17e427fe3674200',
      bandcamp_album_id: '2978544927',
      bandcamp_track_id: '3006004987',
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
    {
      song_title: 'Con EL Tiempo',
      song_artist: 'Biralo, POAN',
      song_url: 'https://open.spotify.com/track/55llenChjuUDOOPnUngdQD?si=d0f0e23b3302472c',
      bandcamp_album_id: '2557687321',
      bandcamp_track_id: '1329193755',
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
    {
      song_title: 'Cloudy Others',
      song_artist: 'Sébastien Casanova',
      song_url: 'https://open.spotify.com/track/6TkYqsGwOkYxbgn2XZiMoq?si=1b849d8f65524733',
      bandcamp_album_id: '931555319',
      bandcamp_track_id: '3522329791',
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
    {
      song_title: 'Ten-Day Interval',
      song_artist: 'Tortoise',
      song_url: 'https://open.spotify.com/track/5A2vl9MadJ87kas3R3GoTm?si=7cee2cd01ac94636',
      bandcamp_album_id: '3449614673',
      bandcamp_track_id: '4290990451',
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
    {
      song_title: 'Chinatown',
      song_artist: 'Destroyer',
      song_url: 'https://open.spotify.com/track/3i729CqF9sBCCyhYxIWUZZ?si=4a824aabd3b344eb',
      bandcamp_album_id: '2680123713',
      bandcamp_track_id: '2298954044',
    },
    {
      song_title: 'Ladies and gentlemen we are floating in space',
      song_artist: 'Spiritualized',
      song_url: 'https://open.spotify.com/track/0fOjUafaAhJV16oRBgCtz7?si=c6bbc7b9deda422b',
      bandcamp_album_id: '3151187748',
      bandcamp_track_id: '1116081171',
    },
    {
      song_title: 'Us And The Rainbow',
      song_artist: 'Babe Rainbow',
      song_url: 'https://open.spotify.com/track/5zfhYnSCXbxyDfnJOawsug?si=00a06016ff87480d',
      bandcamp_album_id: '1409134404',
      bandcamp_track_id: '2580122828',
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
    {
      song_title: 'Morning Haze',
      song_artist: 'The Soundcarriers',
      song_url: 'https://open.spotify.com/track/4H0qJQvjT9E4MVE68cLbqr?si=6ad751cde41548ce',
      bandcamp_album_id: '2499555478',
      bandcamp_track_id: '1194381448',
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
    {
      song_title: 'Prisoner of Mars',
      song_artist: 'Stereolab',
      song_url: 'https://open.spotify.com/track/42bsfzrG16Ob3FSlQqVOWb?si=e2fdd04a106f4d20',
      bandcamp_album_id: '2635973278',
      bandcamp_track_id: '3395956793',
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
    {
      song_title: 'In Case I Fall for You',
      song_artist: 'Black Sea Dahu',
      song_url: 'https://open.spotify.com/track/2qz7KoWTLGuWuIfwqZmk4y?si=d05c7480e96547b6',
      bandcamp_album_id: '2782055252',
      bandcamp_track_id: '502206530',
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
    {
      song_title: 'Sugar for the Pill',
      song_artist: 'Slowdive',
      song_url: 'https://open.spotify.com/track/0eVz3hV2xOXdneGpnWDFpb?si=8360f10db57c4eee',
      bandcamp_album_id: '2948336751',
      bandcamp_track_id: '1213707227',
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
    {
      song_title: 'Donald Pleasence',
      song_artist: 'Flotation Toy Warning',
      song_url: 'https://open.spotify.com/track/5jG5NrEVCm7BDfLCHYvkBK?si=b45e7c25d1ce40b0',
      bandcamp_album_id: '3544751356',
      bandcamp_track_id: '3030355178',
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
    {
      song_title: 'Visions',
      song_artist: 'José González',
      song_url: 'https://open.spotify.com/track/3jJL66ZyGqky4smfnWZr9I?si=4a7ebf92342043e5',
      bandcamp_album_id: '1076773790',
      bandcamp_track_id: '2773131604',
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
    {
      song_title: '- - -',
      song_artist: 'Ana Roxanne',
      song_url: 'https://open.spotify.com/track/28SO6fgdGt1Z6OR6QlBK17?si=983cfb7ba85d4507',
      bandcamp_album_id: '1583037158',
      bandcamp_track_id: '126252579',
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
    {
      song_title: 'Absorption - Citywide',
      song_artist: 'Martinou',
      song_url: 'https://open.spotify.com/track/0sHEfM7ZdpFGLObQiExXPZ?si=b597313028d44dce',
      bandcamp_album_id: '397349128',
      bandcamp_track_id: '3715791630',
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
    {
      song_title: 'Avril 14th',
      song_artist: 'Aphex Twin',
      song_url: 'https://open.spotify.com/track/1uaGSDFsLdReQgg8p7Obwh?si=24662691af874909',
      bandcamp_album_id: '1308944319',
      bandcamp_track_id: '1747246589',
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
    {
      song_title: 'Sonne',
      song_artist: 'Rival Consoles',
      song_url: 'https://open.spotify.com/track/3dQ3D9lT11QubWKCWhkYuS?si=9f72dcee33be4d89',
      bandcamp_album_id: '2756781855',
      bandcamp_track_id: '2223008800',
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
    {
      song_title: 'Beyond Styx Pt 1',
      song_artist: 'hubris.',
      song_url: 'https://open.spotify.com/track/6NuQIYiZEoWXnErCScAbAG?si=62d93025fac243f0',
      bandcamp_album_id: '4269985276',
      bandcamp_track_id: '1188650503',
    },
    {
      song_title: 'III',
      song_artist: 'Athletics',
      song_url: 'https://open.spotify.com/track/3BHlOb4aOdaMaIfJ4M13RP?si=6398f95d9abd49a2',
      bandcamp_album_id: '1056699053',
      bandcamp_track_id: '1244505375',
    },
    {
      song_title: 'Golden Threads from the Sun',
      song_artist: 'Yndi Halda',
      song_url: 'https://open.spotify.com/track/06NK0V9mfs3YkVRtJOTdWL?si=bd85c7c8af7d413f',
      bandcamp_album_id: '3463975801',
      bandcamp_track_id: '8458072',
    },
    {
      song_title: 'From Embrace to Embrace',
      song_artist: 'Joy Wants Eternity',
      song_url: 'https://open.spotify.com/track/2AHejGSGKvO4qu4f26uyEa?si=2272bde3eec14e6b',
      bandcamp_album_id: '2074367101',
      bandcamp_track_id: '2532653551',
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
    {
      song_title: 'Rehearsal',
      song_artist: 'Ekko',
      song_url: 'https://open.spotify.com/track/0psWvS2VU4fwf8Sw31YoX6?si=7b04656782194f64',
      bandcamp_album_id: '2295377305',
      bandcamp_track_id: '546180785',
    },
  ],
  RLOEI: [
    {
      song_title: 'Bread Song',
      song_artist: 'Black Country, New Road',
      song_url: 'https://open.spotify.com/track/5XuU9htN358NTMCcqRvfDV?si=ec63f16ae2ac4692',
      bandcamp_album_id: '3296358317',
      bandcamp_track_id: '2897494632',
    },
    {
      song_title: 'July',
      song_artist: 'Low',
      song_url: 'https://open.spotify.com/track/65gQNlnHb61BphHiDohwoz?si=a51f7e73552644d5',
      bandcamp_album_id: '3489657731',
      bandcamp_track_id: '1907555426',
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
    {
      song_title: 'Andromeda',
      song_artist: 'Weyes Blood',
      song_url: 'https://open.spotify.com/track/51EMSRpNm9Rg5rGViVCczv?si=9d87ee0cae28491b',
      bandcamp_album_id: '2878289508',
      bandcamp_track_id: '2876243173',
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
    {
      song_title: 'Ground and Grave',
      song_artist: 'Ora Cogan',
      song_url: 'https://open.spotify.com/track/6JbWR0tMFi2bmSnOh50kKG?si=94763657d9d84717',
      bandcamp_album_id: '3927565751',
      bandcamp_track_id: '3112985471',
    },
    {
      song_title: 'Dream Odyssey',
      song_artist: 'MONO',
      song_url: 'https://open.spotify.com/track/1mNLJ6NjBPbWjmbbdMLCzf?si=7721c12719fc4e3d',
      bandcamp_album_id: '387017190',
      bandcamp_track_id: '3976603346',
    },
    {
      song_title: 'Are Your There?',
      song_artist: 'MONO',
      song_url: 'https://open.spotify.com/track/5uK3MgCUXANoPoAhWqdfe8?si=00ed43a9e2c94311',
      bandcamp_album_id: '2030436015',
      bandcamp_track_id: '1218005742',
    },
    {
      song_title: 'Migration of Souls',
      song_artist: 'M.Ward',
      song_url: 'https://open.spotify.com/track/2GmGy1eJTvPACm3ekX0hxD?si=cba8f2db03ab4e11',
      bandcamp_album_id: '203984459',
      bandcamp_track_id: '3686102028',
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
    {
      song_title: 'Heliosphan',
      song_artist: 'Aphex Twin',
      song_url: 'https://open.spotify.com/track/09opLVMX7cfKVKlP3iKZR1?si=30245c3be3214b0b',
      bandcamp_album_id: '1881652386',
      bandcamp_track_id: '4007080566',
    },
    {
      song_title: 'Sea-Watch',
      song_artist: 'Floating Points',
      song_url: 'https://open.spotify.com/track/343MTAHIcZRw91arzrMeDs?si=942e852da03e4289',
      bandcamp_album_id: '2422513439',
      bandcamp_track_id: '1912242148',
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
