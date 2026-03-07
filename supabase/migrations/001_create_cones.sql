-- Cones table for Supabase (replaces SQLite)
create table if not exists public.cones (
  id                text primary key,
  session_id        text not null,
  image_path        text not null,
  description       text,
  location          text,
  about             text,
  openness          integer,
  conscientiousness integer,
  extraversion      integer,
  agreeableness     integer,
  neuroticism       integer,
  core_values       jsonb default '[]'::jsonb,
  song_title        text,
  song_artist       text,
  spotify_track_id  text,
  is_impostor       smallint default 0,
  is_analyzed       smallint default 0,
  created_at        timestamptz default now()
);

-- Index for listing by session and by created_at
create index if not exists cones_session_id_idx on public.cones (session_id);
create index if not exists cones_created_at_idx on public.cones (created_at asc);
