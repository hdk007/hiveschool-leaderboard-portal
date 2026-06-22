-- =============================================================================
-- HiveSchool Leaderboard Portal — 0003 Row Level Security
-- Public (anon) users can READ the public-facing data; only admins can write.
-- =============================================================================

-- Enable RLS on every table.
alter table public.admins                enable row level security;
alter table public.students              enable row level security;
alter table public.leaderboard_settings  enable row level security;
alter table public.curriculum_modules    enable row level security;
alter table public.announcements         enable row level security;
alter table public.weekly_challenges     enable row level security;
alter table public.achievements          enable row level security;
alter table public.student_achievements  enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.leaderboard_history   enable row level security;
alter table public.notifications         enable row level security;
alter table public.activity_logs         enable row level security;

-- -----------------------------------------------------------------------------
-- Helper to (re)create a policy idempotently.
-- -----------------------------------------------------------------------------

-- ===== Public read-only tables =============================================
-- These are readable by anon + authenticated; writable only by admins.
do $$
declare
  t text;
begin
  foreach t in array array[
    'students', 'leaderboard_settings', 'curriculum_modules', 'announcements',
    'weekly_challenges', 'achievements', 'student_achievements',
    'challenge_participants', 'leaderboard_history', 'notifications'
  ]
  loop
    -- public read
    execute format('drop policy if exists "public_read_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "public_read_%1$s" on public.%1$s
         for select using (true);', t
    );

    -- admin insert
    execute format('drop policy if exists "admin_insert_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin_insert_%1$s" on public.%1$s
         for insert with check (public.is_admin());', t
    );

    -- admin update
    execute format('drop policy if exists "admin_update_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin_update_%1$s" on public.%1$s
         for update using (public.is_admin()) with check (public.is_admin());', t
    );

    -- admin delete
    execute format('drop policy if exists "admin_delete_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin_delete_%1$s" on public.%1$s
         for delete using (public.is_admin());', t
    );
  end loop;
end $$;

-- ===== admins (admin-only, fully) ==========================================
drop policy if exists "admin_select_admins" on public.admins;
create policy "admin_select_admins" on public.admins
  for select using (public.is_admin());

drop policy if exists "admin_write_admins" on public.admins;
create policy "admin_write_admins" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());

-- ===== activity_logs (admin reads; admins write the audit trail) ===========
drop policy if exists "admin_select_logs" on public.activity_logs;
create policy "admin_select_logs" on public.activity_logs
  for select using (public.is_admin());

drop policy if exists "admin_insert_logs" on public.activity_logs;
create policy "admin_insert_logs" on public.activity_logs
  for insert with check (public.is_admin());
