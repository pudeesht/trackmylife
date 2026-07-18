-- Day 6 schema for TrackMyLife optional daily metrics (sleep + screen time)
-- Run this in Supabase SQL Editor once. Safe to re-run (idempotent).

-- Bedtime: the clock time you fell asleep (nullable). Stored as a time-of-day.
alter table public.daily_entries add column if not exists bedtime time;

-- Instagram usage in minutes for the day (nullable).
alter table public.daily_entries add column if not exists instagram_minutes smallint;

-- Keep instagram_minutes within a sane range (0..1440). Added idempotently.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'daily_entries_instagram_minutes_range'
  ) then
    alter table public.daily_entries
      add constraint daily_entries_instagram_minutes_range
      check (instagram_minutes is null or (instagram_minutes >= 0 and instagram_minutes <= 1440));
  end if;
end $$;
