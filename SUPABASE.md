# Supabase setup for Cones

This project uses **Supabase** as the database (replacing SQLite) so it runs on Vercel and other serverless hosts.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → pick org, name, password, region.
3. Wait for the project to be ready.

## 2. Create the `cones` table

In the Supabase dashboard:

1. Open **SQL Editor**.
2. Run the SQL from **supabase/migrations/001_create_cones.sql** (or paste below):

```sql
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

create index if not exists cones_session_id_idx on public.cones (session_id);
create index if not exists cones_created_at_idx on public.cones (created_at asc);
```

## 3. Get your API keys

1. In Supabase: **Project Settings** → **API**.
2. Copy **Project URL** → `SUPABASE_URL`.
3. Choose one:
   - **anon / publishable** key → `SUPABASE_ANON_KEY` (safe to use with RLS; see step 3b).
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS; keep secret).

### 3b. Using the anon (publishable) key with RLS

If you use `SUPABASE_ANON_KEY`, enable RLS and add policies so the app can read/write:

1. Open **SQL Editor** and run **supabase/migrations/002_enable_rls_cones.sql** (or paste below):

```sql
alter table public.cones enable row level security;

create policy "Allow read cones" on public.cones for select using (true);
create policy "Allow insert cones" on public.cones for insert with check (true);
create policy "Allow update cones" on public.cones for update using (true) with check (true);
create policy "Allow delete cones" on public.cones for delete using (true);
```

2. For **Storage** (bucket `cones`): in **Storage** → **Policies** for bucket `cones`, add a policy that allows **insert** for role `anon` (so the app can upload images with the anon key). Public read is already enabled if the bucket is public.

## 4. Configure the app

**Local:**

- Copy `.env.local.example` to `.env.local`.
- Set `SUPABASE_URL` and either `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

**Vercel:**

- Project → **Settings** → **Environment Variables**.
- Add `SUPABASE_URL` and either `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

## 5. Install and run

```bash
npm install
npm run dev
```

The app will use Supabase for all cone data.

## 6. (Recommended) Supabase Storage for images

To store cone images in Supabase so they persist on Vercel:

1. In Supabase: **Storage** → **New bucket**.
2. Name: `cones`. Set **Public bucket** to **Yes** (so image URLs work).
3. Create the bucket.

When `SUPABASE_URL` and either `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` are set, the app uploads resized images to this bucket. If you use the **anon key**, add a Storage policy on bucket `cones` that allows **insert** for the anon role so uploads succeed.

## 7. Seed with your own cone images (optional)

To **put all your cone images and profiles into Supabase** (the 14 images in `assets/`):

1. **Prerequisites**
   - Supabase Storage bucket **cones** exists and is **Public**.
   - If you use the **anon key**: add a Storage policy on bucket `cones` allowing **insert** for role `anon`.
   - `.env.local` has `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), and `ANTHROPIC_API_KEY`.

2. **Run the seed script** (resizes images, uploads to Storage, creates cone rows, runs AI analysis for each):

```bash
npm run seed
```

This uploads every image in `assets/` to Supabase Storage and creates one cone per image with full personality profile (description, Big Five, core values, song). Optional: set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` for song embeds.
