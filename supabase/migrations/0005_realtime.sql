-- =============================================================================
-- HiveSchool Leaderboard Portal — 0005 Realtime
-- Add the public-facing tables to the supabase_realtime publication so clients
-- receive INSERT / UPDATE / DELETE events for live, no-refresh updates.
-- =============================================================================

-- REPLICA IDENTITY FULL ensures DELETE / UPDATE payloads include the old row,
-- which the client needs to animate rank changes and remove deleted rows.
alter table public.students             replica identity full;
alter table public.announcements        replica identity full;
alter table public.weekly_challenges    replica identity full;
alter table public.curriculum_modules   replica identity full;
alter table public.achievements         replica identity full;
alter table public.notifications        replica identity full;
alter table public.leaderboard_settings replica identity full;

-- Add tables to the realtime publication (created automatically by Supabase).
do $$
declare
  t text;
begin
  foreach t in array array[
    'students', 'announcements', 'weekly_challenges', 'curriculum_modules',
    'achievements', 'student_achievements', 'notifications', 'leaderboard_settings'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception
      when duplicate_object then null;   -- already in the publication
      when undefined_object then null;   -- publication not present (local CLI edge case)
    end;
  end loop;
end $$;
