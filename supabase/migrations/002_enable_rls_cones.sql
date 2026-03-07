-- Enable RLS on cones (use with anon/publishable key)
alter table public.cones enable row level security;

-- Allow read all (for list "all" and "mine" by session_id – filtering is done in app)
create policy "Allow read cones"
  on public.cones for select
  using (true);

-- Allow insert (new cones from upload)
create policy "Allow insert cones"
  on public.cones for insert
  with check (true);

-- Allow update (e.g. after AI analysis)
create policy "Allow update cones"
  on public.cones for update
  using (true)
  with check (true);

-- Allow delete (app enforces session_id in API; RLS allows so anon key can call delete)
create policy "Allow delete cones"
  on public.cones for delete
  using (true);
