import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'cones.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS cones (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL,
    image_path      TEXT NOT NULL,
    description     TEXT,
    location        TEXT,
    about           TEXT,
    openness        INTEGER,
    conscientiousness INTEGER,
    extraversion    INTEGER,
    agreeableness   INTEGER,
    neuroticism     INTEGER,
    core_values     TEXT,
    song_title      TEXT,
    song_artist     TEXT,
    spotify_track_id TEXT,
    is_impostor     INTEGER DEFAULT 0,
    is_analyzed     INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
  )
`);

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
  core_values: string | null;
  song_title: string | null;
  song_artist: string | null;
  spotify_track_id: string | null;
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
    core_values: row.core_values ? JSON.parse(row.core_values) : [],
    index,
  };
}

export function getAllCones(): Cone[] {
  const rows = db
    .prepare('SELECT * FROM cones ORDER BY created_at ASC')
    .all() as ConeRow[];
  return rows.map((r, i) => parseRow(r, i + 1));
}

export function getMyCones(sessionId: string): Cone[] {
  const rows = db
    .prepare('SELECT * FROM cones WHERE session_id = ? ORDER BY created_at ASC')
    .all(sessionId) as ConeRow[];
  return rows.map((r, i) => parseRow(r, i + 1));
}

export function getConeById(id: string): Cone | null {
  const allRows = db
    .prepare('SELECT * FROM cones ORDER BY created_at ASC')
    .all() as ConeRow[];
  const idx = allRows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  return parseRow(allRows[idx], idx + 1);
}

export function insertCone(data: {
  id: string;
  session_id: string;
  image_path: string;
}): void {
  db.prepare(
    'INSERT INTO cones (id, session_id, image_path) VALUES (?, ?, ?)'
  ).run(data.id, data.session_id, data.image_path);
}

export function updateConeAnalysis(
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
    spotify_track_id: string | null;
    is_impostor: number;
  }
): void {
  db.prepare(`
    UPDATE cones SET
      description = ?,
      location = ?,
      about = ?,
      openness = ?,
      conscientiousness = ?,
      extraversion = ?,
      agreeableness = ?,
      neuroticism = ?,
      core_values = ?,
      song_title = ?,
      song_artist = ?,
      spotify_track_id = ?,
      is_impostor = ?,
      is_analyzed = 1
    WHERE id = ?
  `).run(
    data.description,
    data.location,
    data.about,
    data.openness,
    data.conscientiousness,
    data.extraversion,
    data.agreeableness,
    data.neuroticism,
    JSON.stringify(data.core_values),
    data.song_title,
    data.song_artist,
    data.spotify_track_id,
    data.is_impostor,
    id
  );
}

export function deleteCone(id: string, sessionId: string): boolean {
  const result = db
    .prepare('DELETE FROM cones WHERE id = ? AND session_id = ?')
    .run(id, sessionId);
  return result.changes > 0;
}

export function countAllCones(): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM cones').get() as { count: number };
  return row.count;
}

// ── Seed example cones (runs once if DB is empty) ─────────────────────────────
const SEED_SESSION = '__seed__';

const SEED_DATA = [
  {
    id: 'seed-01',
    desc: 'The Sentinel',
    loc: 'Times Square, NY',
    about: 'Stoic and unwavering, this cone has stood at the crossroads of one of the world\'s most chaotic intersections for years. It has witnessed a thousand near-misses, a hundred arguments, and at least one proposal. It remembers every one. People pass, seasons shift, scaffolding rises and falls — yet here it stands, fluorescent and resolute, asking nothing in return.',
    o: 58, c: 92, e: 34, a: 70, n: 44,
    values: ['Duty', 'Vigilance', 'Order', 'Stability', 'Perseverance', 'Memory'],
    song: 'Eye of the Tiger', artist: 'Survivor',
    img: 'https://picsum.photos/seed/cone-a/400/400',
    date: '2025-01-01 10:00:00',
  },
  {
    id: 'seed-02',
    desc: 'The Dreamer',
    loc: 'Portland, OR',
    about: 'Perpetually gazing skyward, this cone imagines itself as a lighthouse guiding ships through fog on some distant shore. The Pacific rain does not bother it. It has catalogued forty-seven different cloud formations and believes each one is a message. One day, it thinks, something extraordinary will happen right here on this corner. It is content to wait.',
    o: 96, c: 38, e: 54, a: 82, n: 30,
    values: ['Wonder', 'Freedom', 'Creativity', 'Hope', 'Intuition', 'Imagination'],
    song: 'Somewhere Only We Know', artist: 'Keane',
    img: 'https://picsum.photos/seed/cone-b/400/400',
    date: '2025-01-02 10:00:00',
  },
  {
    id: 'seed-03',
    desc: 'The Stoic',
    loc: 'Chicago, IL',
    about: 'Unmoved by wind, by rain, or by the relentless judgment of pedestrians who photograph it ironically. It endures because endurance is the only philosophy it has ever needed. The cold is not suffering — it is simply winter. The heat is not suffering — it is simply summer. To be a cone is to know that meaning is not found, it is decided.',
    o: 42, c: 78, e: 22, a: 65, n: 18,
    values: ['Resilience', 'Patience', 'Minimalism', 'Endurance', 'Clarity'],
    song: 'The Sound of Silence', artist: 'Simon & Garfunkel',
    img: 'https://picsum.photos/seed/cone-c/400/400',
    date: '2025-01-03 10:00:00',
  },
  {
    id: 'seed-04',
    desc: 'The Socialite',
    loc: 'Miami, FL',
    about: 'Bright, warm, and absolutely thriving in the sunshine. This cone loves a crowd and a crowd loves it back — it has been tagged in 847 social media posts and counting. The party always moves somewhere else eventually, but this cone stays, glowing under the Biscayne Bay light, ready for the next one. Life, it has decided, is too short to be inconspicuous.',
    o: 80, c: 52, e: 94, a: 90, n: 38,
    values: ['Joy', 'Connection', 'Presence', 'Warmth', 'Celebration', 'Visibility'],
    song: 'Dancing Queen', artist: 'ABBA',
    img: 'https://picsum.photos/seed/cone-d/400/400',
    date: '2025-01-04 10:00:00',
  },
  {
    id: 'seed-05',
    desc: 'The Philosopher',
    loc: 'Austin, TX',
    about: 'This cone spends its days contemplating traffic flow as a metaphor for the human condition. If a cone falls in an empty lot and no one marks the hazard, was there ever really a hazard? It has arrived at no satisfying conclusions, but finds the inquiry itself worthwhile. The university students who pass it every day suspect it is watching them back. They are correct.',
    o: 92, c: 58, e: 36, a: 72, n: 50,
    values: ['Truth', 'Inquiry', 'Depth', 'Contemplation', 'Meaning', 'Solitude'],
    song: 'The Sound of Silence', artist: 'Disturbed',
    img: 'https://picsum.photos/seed/cone-a/400/400',
    date: '2025-01-05 10:00:00',
  },
  {
    id: 'seed-06',
    desc: 'The Rebel',
    loc: 'Brooklyn, NY',
    about: 'Placed without a permit. Moved without ceremony. Documented without consent. This cone has been confiscated three times and returned twice under circumstances that remain unexplained. It operates outside sanctioned zones and respects no construction schedule. Neighbors have stopped asking who placed it. They have accepted, instead, that some cones simply belong.',
    o: 88, c: 28, e: 74, a: 42, n: 62,
    values: ['Autonomy', 'Defiance', 'Authenticity', 'Freedom', 'Instinct', 'Disruption'],
    song: 'Should I Stay or Should I Go', artist: 'The Clash',
    img: 'https://picsum.photos/seed/cone-b/400/400',
    date: '2025-01-06 10:00:00',
  },
  {
    id: 'seed-07',
    desc: 'The Worrier',
    loc: 'Seattle, WA',
    about: 'Constantly scanning for hazards that may or may not materialize. It is not pessimism, it insists — it is preparedness. The distinction matters enormously. This cone has flagged sixteen potential incidents this week alone, three of which were clouds. It knows that most things will probably be fine. But probably is not certainly, and that gap, however small, demands vigilance.',
    o: 60, c: 80, e: 32, a: 84, n: 90,
    values: ['Safety', 'Caution', 'Care', 'Alertness', 'Protection', 'Foresight'],
    song: 'Creep', artist: 'Radiohead',
    img: 'https://picsum.photos/seed/cone-c/400/400',
    date: '2025-01-07 10:00:00',
  },
  {
    id: 'seed-08',
    desc: 'The Leader',
    loc: 'Washington, DC',
    about: 'First on the scene, last to leave. Other cones arrange themselves around it by instinct, as if drawn by some invisible chain of command. It has never asked for this responsibility. It does not need to. When the crew forgets to put out the closing cone at the end of a lane, something feels wrong to everyone present, though no one can say exactly why.',
    o: 72, c: 92, e: 84, a: 62, n: 35,
    values: ['Integrity', 'Commitment', 'Service', 'Leadership', 'Reliability', 'Presence'],
    song: 'We Are the Champions', artist: 'Queen',
    img: 'https://picsum.photos/seed/cone-d/400/400',
    date: '2025-01-08 10:00:00',
  },
  {
    id: 'seed-09',
    desc: 'The Minimalist',
    loc: 'San Francisco, CA',
    about: 'One cone. One lane. Nothing else required. This cone has rejected the baroque complexity of its surroundings — the signage, the barriers, the blinking arrows — in favor of a single pure statement. It believes that presence, fully committed, is sufficient. The tech workers who commute past it each morning have begun to find this philosophy oddly comforting.',
    o: 52, c: 70, e: 28, a: 76, n: 24,
    values: ['Simplicity', 'Clarity', 'Intention', 'Focus', 'Restraint'],
    song: 'Mad World', artist: 'Gary Jules',
    img: 'https://picsum.photos/seed/cone-a/400/400',
    date: '2025-01-09 10:00:00',
  },
  {
    id: 'seed-10',
    desc: 'The Optimist',
    loc: 'New Orleans, LA',
    about: 'Beaming with fluorescent warmth on every corner of the French Quarter. This cone sees every construction delay not as inconvenience but as invitation — an invitation to take the longer way, to notice something new, to be briefly lost. The pothole it marks was, from a certain angle, a gift. Everything broken eventually becomes a reason to build something better.',
    o: 90, c: 48, e: 86, a: 94, n: 20,
    values: ['Hope', 'Gratitude', 'Warmth', 'Joy', 'Openness', 'Generosity'],
    song: 'Happy', artist: 'Pharrell Williams',
    img: 'https://picsum.photos/seed/cone-b/400/400',
    date: '2025-01-10 10:00:00',
  },
  {
    id: 'seed-11',
    desc: 'The Ancient',
    loc: 'Boston, MA',
    about: 'Weathered by four decades of nor\'easters, bitter winters, and the particular indignity of being used as a hockey goal by children who should know better. Its stripes have faded to a kind of dignified pale. Every crack in its surface marks a specific event it does not care to discuss. It has outlasted three repaving projects and two mayors. It expects to outlast several more.',
    o: 68, c: 84, e: 26, a: 70, n: 40,
    values: ['Memory', 'Endurance', 'Dignity', 'Wisdom', 'Resilience', 'History'],
    song: 'Old Man', artist: 'Neil Young',
    img: 'https://picsum.photos/seed/cone-c/400/400',
    date: '2025-01-11 10:00:00',
  },
  {
    id: 'seed-12',
    desc: 'The Mystery',
    loc: 'Unknown',
    about: 'No records. No permits. No work order, no city log, no maintenance ticket with this cone\'s coordinates. It appeared one Tuesday morning and no department has claimed it. The road it marks shows no damage. The area it cordons has no obvious hazard. Some people cross the street to avoid it. Others photograph it from a respectful distance. Some say it was always there.',
    o: 78, c: 55, e: 50, a: 64, n: 60,
    values: ['Mystery', 'Impermanence', 'Wonder', 'Ambiguity', 'Presence', 'Silence'],
    song: 'Mysterious Ways', artist: 'U2',
    img: 'https://picsum.photos/seed/cone-d/400/400',
    date: '2025-01-12 10:00:00',
  },
];

function seedExampleCones(): void {
  // Use INSERT OR REPLACE so updated seed data refreshes on each restart
  const insert = db.prepare(`
    INSERT OR REPLACE INTO cones (
      id, session_id, image_path, description, location, about,
      openness, conscientiousness, extraversion, agreeableness, neuroticism,
      core_values, song_title, song_artist, spotify_track_id,
      is_impostor, is_analyzed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 1, ?)
  `);

  for (const s of SEED_DATA) {
    insert.run(
      s.id, SEED_SESSION, s.img, s.desc, s.loc, s.about,
      s.o, s.c, s.e, s.a, s.n,
      JSON.stringify(s.values), s.song, s.artist,
      s.date,
    );
  }
}

seedExampleCones();

export default db;
