-- Add SLOAN (5-letter Big Five summary) to cones
alter table if exists public.cones
  add column if not exists sloan text;
