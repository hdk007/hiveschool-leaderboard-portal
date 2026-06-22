-- =============================================================================
-- HiveSchool Leaderboard Portal — COMBINED SCHEMA (Student-Centric Version)
-- Paste this entire file into the Supabase SQL Editor and run once.
-- Then run npm run seed locally to create the admin + demo data.
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto (available by default on Supabase).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Clean rebuild: Drop all existing tables first to avoid schema mismatch
-- -----------------------------------------------------------------------------
drop table if exists public.student_achievements cascade;
drop table if exists public.student_challenge_scores cascade;
drop table if exists public.team_challenge_scores cascade;
drop table if exists public.daily_challenges cascade;
drop table if exists public.leaderboard_history cascade;
drop table if exists public.notifications cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.students cascade;
drop table if exists public.achievements cascade;
drop table if exists public.announcements cascade;
drop table if exists public.curriculum_modules cascade;
drop table if exists public.teams cascade;
drop table if exists public.admins cascade;
drop table if exists public.leaderboard_settings cascade;

-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type student_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type announcement_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type challenge_status as enum ('upcoming', 'active', 'completed');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- admins
-- A thin profile table that marks which Supabase Auth users are administrators.
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text default 'HiveSchool Admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- teams
-- -----------------------------------------------------------------------------
create table if not exists public.teams (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null unique,
  team_logo              text,
  captain_name           text,
  description            text,
  total_points           numeric(12,2) not null default 0,
  challenge_points       numeric(12,2) not null default 0,
  total_students         integer not null default 0,
  rank                   integer,
  previous_rank          integer,
  growth_percentage      numeric(6,2) not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_teams_rank on public.teams (rank);
create index if not exists idx_teams_total_points on public.teams (total_points desc);

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
create table if not exists public.students (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  email                  text not null unique,
  phone                  text,
  profile_image          text,
  team_id                uuid references public.teams(id) on delete set null,
  attendance_percentage  numeric(5,2) not null default 0 check (attendance_percentage >= 0 and attendance_percentage <= 100),
  revenue_generated      numeric(12,2) not null default 0,
  assignments_completed  integer not null default 0,
  challenge_score        numeric(12,2) not null default 0,
  final_score            numeric(12,2) not null default 0,
  rank                   integer,
  previous_rank          integer,
  growth_percentage      numeric(6,2) not null default 0,
  batch                  text,
  notes                  text,
  status                 student_status not null default 'active',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_students_team on public.students (team_id);
create index if not exists idx_students_status on public.students (status);
create index if not exists idx_students_rank on public.students (rank);
create index if not exists idx_students_final_score on public.students (final_score desc);

-- -----------------------------------------------------------------------------
-- leaderboard_settings (single configurable row of ranking weights)
-- Weights are stored as fractions and must sum to 1.0.
-- -----------------------------------------------------------------------------
create table if not exists public.leaderboard_settings (
  id                 uuid primary key default gen_random_uuid(),
  -- Student score weights — assignments + attendance must sum to 1.0.
  -- revenue_weight / challenge_weight are retained at 0 (challenges are now
  -- scored at the team level; students no longer generate revenue).
  revenue_weight     numeric(4,3) not null default 0.000,
  assignment_weight  numeric(4,3) not null default 0.600,
  attendance_weight  numeric(4,3) not null default 0.400,
  challenge_weight   numeric(4,3) not null default 0.000,
  updated_at         timestamptz not null default now(),
  constraint weights_sum_to_one check (
    round(revenue_weight + assignment_weight + attendance_weight + challenge_weight, 3) = 1.000
  )
);

-- -----------------------------------------------------------------------------
-- curriculum_modules
-- -----------------------------------------------------------------------------
create table if not exists public.curriculum_modules (
  id                     uuid primary key default gen_random_uuid(),
  module_name            text not null,
  description            text,
  topics                 jsonb not null default '[]'::jsonb,
  assignments            jsonb not null default '[]'::jsonb,
  resources              jsonb not null default '[]'::jsonb,
  duration               text,
  completion_percentage  numeric(5,2) not null default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
  order_index            integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_curriculum_order on public.curriculum_modules (order_index);

-- -----------------------------------------------------------------------------
-- announcements
-- -----------------------------------------------------------------------------
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  priority     announcement_priority not null default 'normal',
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_announcements_pinned on public.announcements (is_pinned, created_at desc);

-- -----------------------------------------------------------------------------
-- daily_challenges
-- -----------------------------------------------------------------------------
create table if not exists public.daily_challenges (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  points              integer not null default 100,
  deadline            timestamptz,
  status              challenge_status not null default 'active',
  leaderboard_impact  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- achievements (badge catalog)
-- -----------------------------------------------------------------------------
create table if not exists public.achievements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null unique,
  description  text,
  icon         text not null default 'Award',
  color        text not null default '#7C3AED',
  criteria     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- student_achievements (awards / unlocks)
-- -----------------------------------------------------------------------------
create table if not exists public.student_achievements (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id) on delete cascade,
  achievement_id  uuid not null references public.achievements(id) on delete cascade,
  awarded_at      timestamptz not null default now(),
  unique (student_id, achievement_id)
);

create index if not exists idx_student_achievements_student on public.student_achievements (student_id);

-- -----------------------------------------------------------------------------
-- student_challenge_scores  (LEGACY — retained but no longer feeds scoring;
-- daily challenges are now scored per team, see team_challenge_scores below.)
-- -----------------------------------------------------------------------------
create table if not exists public.student_challenge_scores (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.daily_challenges(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  score         numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  unique (challenge_id, student_id)
);

create index if not exists idx_student_challenge_scores_challenge on public.student_challenge_scores (challenge_id);
create index if not exists idx_student_challenge_scores_student on public.student_challenge_scores (student_id);

-- -----------------------------------------------------------------------------
-- team_challenge_scores  (daily-challenge points awarded to a TEAM)
-- -----------------------------------------------------------------------------
create table if not exists public.team_challenge_scores (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.daily_challenges(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  score         numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  unique (challenge_id, team_id)
);

create index if not exists idx_team_challenge_scores_challenge on public.team_challenge_scores (challenge_id);
create index if not exists idx_team_challenge_scores_team on public.team_challenge_scores (team_id);

-- -----------------------------------------------------------------------------
-- leaderboard_history (periodic snapshots for trend / growth analytics)
-- -----------------------------------------------------------------------------
create table if not exists public.leaderboard_history (
  id                     uuid primary key default gen_random_uuid(),
  team_id                uuid not null references public.teams(id) on delete cascade,
  rank                   integer,
  previous_rank          integer,
  total_points           numeric(12,2) not null default 0,
  total_students         integer not null default 0,
  avg_revenue            numeric(12,2) not null default 0,
  avg_attendance         numeric(5,2) not null default 0,
  snapshot_at            timestamptz not null default now()
);

create index if not exists idx_history_team on public.leaderboard_history (team_id, snapshot_at desc);

-- -----------------------------------------------------------------------------
-- notifications (notification center feed)
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'info',
  title       text not null,
  message     text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_created on public.notifications (created_at desc);

-- -----------------------------------------------------------------------------
-- activity_logs (audit trail)
-- -----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  action        text not null,
  performed_by  text,
  entity_type   text,
  entity_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_activity_created on public.activity_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- is_admin(): true when the current auth user is in public.admins.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins a where a.id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- set_updated_at(): generic trigger to maintain updated_at on row changes.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach the updated_at trigger to every table that has the column.
do $$
declare
  t text;
begin
  foreach t in array array[
    'admins', 'teams', 'students', 'leaderboard_settings', 'curriculum_modules',
    'announcements', 'daily_challenges', 'achievements'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t
     );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- recalculate_leaderboard()
-- -----------------------------------------------------------------------------
create or replace function public.recalculate_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w_asg   numeric;
  w_att   numeric;
  max_asg numeric;
begin
  -- Latest weights (assignments + attendance, sum to 1.0). Fall back to defaults.
  select assignment_weight, attendance_weight
    into w_asg, w_att
  from public.leaderboard_settings
  order by updated_at desc
  limit 1;

  if w_asg is null then
    w_asg := 0.60; w_att := 0.40;
  end if;

  -- Normalise assignments against the active-cohort max (guard divide-by-zero).
  -- `where id is not null` on later UPDATEs is intentional — always true (id is
  -- the PK) but satisfies the `safeupdate` extension which blocks unqualified writes.
  select coalesce(nullif(max(assignments_completed), 0), 1)
    into max_asg
  from public.students
  where status = 'active';

  -- Preserve the current student ranks as previous_rank for change indicators.
  update public.students set previous_rank = rank where id is not null;

  -- Student final score = assignments + attendance (normalised 0-100 blend).
  with scored_students as (
    select
      id,
      case
        when status = 'inactive' then 0
        else round(
            w_asg * (assignments_completed::numeric / max_asg * 100)
          + w_att * attendance_percentage
        , 2)
      end as score
    from public.students
  )
  update public.students s
     set final_score = sc.score
    from scored_students sc
   where s.id = sc.id;

  -- Compute student ranks among active students
  with ranked_students as (
    select
      id,
      rank() over (order by final_score desc, name asc) as new_rank
    from public.students
    where status = 'active'
  )
  update public.students s
     set rank = r.new_rank,
         growth_percentage = case
           when s.previous_rank is null or s.previous_rank = 0 then 0
           else round(((s.previous_rank - r.new_rank)::numeric / s.previous_rank) * 100, 2)
         end
    from ranked_students r
   where s.id = r.id;

  -- For inactive students, rank should be null, growth 0
  update public.students
     set rank = null,
         growth_percentage = 0
   where status = 'inactive';

  -- Now update teams
  -- Preserve the current team ranks as previous_rank for change indicators.
  update public.teams set previous_rank = rank where id is not null;

  -- Team total = sum(active student scores) + the team's daily-challenge points.
  with team_aggregates as (
    select
      t.id,
      coalesce(sum(case when s.status = 'active' then s.final_score else 0 end), 0) as student_points,
      coalesce(sum(case when s.status = 'active' then 1 else 0 end), 0) as agg_students
    from public.teams t
    left join public.students s on s.team_id = t.id
    group by t.id
  ),
  team_challenges as (
    select team_id, coalesce(sum(score), 0) as challenge_points
    from public.team_challenge_scores
    group by team_id
  )
  update public.teams t
     set challenge_points = coalesce(tc.challenge_points, 0),
         total_points     = ta.student_points + coalesce(tc.challenge_points, 0),
         total_students   = ta.agg_students
    from team_aggregates ta
    left join team_challenges tc on tc.team_id = ta.id
   where t.id = ta.id;

  -- Re-rank teams based on total_points
  with ranked_teams as (
    select
      id,
      rank() over (order by total_points desc, name asc) as new_rank
    from public.teams
  )
  update public.teams t
     set rank = rt.new_rank,
         growth_percentage = case
           when t.previous_rank is null or t.previous_rank = 0 then 0
           else round(((t.previous_rank - rt.new_rank)::numeric / t.previous_rank) * 100, 2)
         end
    from ranked_teams rt
   where t.id = rt.id;

end;
$$;

-- -----------------------------------------------------------------------------
-- snapshot_leaderboard(): persist the current standings into history.
-- -----------------------------------------------------------------------------
create or replace function public.snapshot_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_history
    (team_id, rank, previous_rank, total_points, total_students, avg_revenue, avg_attendance)
  select
    t.id,
    t.rank,
    t.previous_rank,
    t.total_points,
    t.total_students,
    coalesce((select avg(s.revenue_generated) from public.students s where s.team_id = t.id and s.status = 'active'), 0),
    coalesce((select avg(s.attendance_percentage) from public.students s where s.team_id = t.id and s.status = 'active'), 0)
  from public.teams t;
end;
$$;

-- -----------------------------------------------------------------------------
-- Trigger plumbing
-- -----------------------------------------------------------------------------
create or replace function public.trg_students_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_students_recalc on public.students;
create trigger trg_students_recalc
  after insert or update or delete on public.students
  for each statement
  execute function public.trg_students_recalc();

create or replace function public.trg_teams_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_teams_recalc on public.teams;
create trigger trg_teams_recalc
  after insert or update or delete on public.teams
  for each statement
  execute function public.trg_teams_recalc();

create or replace function public.trg_team_challenge_scores_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_team_challenge_scores_recalc on public.team_challenge_scores;
create trigger trg_team_challenge_scores_recalc
  after insert or update or delete on public.team_challenge_scores
  for each statement
  execute function public.trg_team_challenge_scores_recalc();

create or replace function public.trg_settings_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_leaderboard();
  return null;
end;
$$;

drop trigger if exists trg_settings_recalc on public.leaderboard_settings;
create trigger trg_settings_recalc
  after insert or update on public.leaderboard_settings
  for each statement
  execute function public.trg_settings_recalc();

grant execute on function public.recalculate_leaderboard() to authenticated, service_role;
grant execute on function public.snapshot_leaderboard() to authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.admins                enable row level security;
alter table public.teams                 enable row level security;
alter table public.students              enable row level security;
alter table public.leaderboard_settings  enable row level security;
alter table public.curriculum_modules    enable row level security;
alter table public.announcements         enable row level security;
alter table public.daily_challenges      enable row level security;
alter table public.achievements          enable row level security;
alter table public.student_achievements  enable row level security;
alter table public.student_challenge_scores enable row level security;
alter table public.team_challenge_scores enable row level security;
alter table public.leaderboard_history   enable row level security;
alter table public.notifications         enable row level security;
alter table public.activity_logs         enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'teams', 'students', 'leaderboard_settings', 'curriculum_modules', 'announcements',
    'daily_challenges', 'achievements', 'student_achievements',
    'student_challenge_scores', 'team_challenge_scores', 'leaderboard_history', 'notifications'
  ]
  loop
    execute format('drop policy if exists "public_read_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "public_read_%1$s" on public.%1$s
         for select using (true);', t
    );

    execute format('drop policy if exists "admin_insert_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin_insert_%1$s" on public.%1$s
         for insert with check (public.is_admin());', t
    );

    execute format('drop policy if exists "admin_update_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin_update_%1$s" on public.%1$s
         for update using (public.is_admin()) with check (public.is_admin());', t
    );

    execute format('drop policy if exists "admin_delete_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "admin_delete_%1$s" on public.%1$s
         for delete using (public.is_admin());', t
    );
  end loop;
end $$;

drop policy if exists "admin_select_admins" on public.admins;
create policy "admin_select_admins" on public.admins
  for select using (public.is_admin());

drop policy if exists "admin_write_admins" on public.admins;
create policy "admin_write_admins" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_select_logs" on public.activity_logs;
create policy "admin_select_logs" on public.activity_logs
  for select using (public.is_admin());

drop policy if exists "admin_insert_logs" on public.activity_logs;
create policy "admin_insert_logs" on public.activity_logs
  for insert with check (public.is_admin());

-- =============================================================================
-- Storage Buckets & Policies
-- =============================================================================
insert into storage.buckets (id, name, public)
values
  ('student-images',      'student-images',      true),
  ('team-logos',          'team-logos',          true),
  ('achievement-icons',   'achievement-icons',   true),
  ('curriculum-assets',   'curriculum-assets',   true),
  ('challenge-assets',    'challenge-assets',     true),
  ('announcement-assets', 'announcement-assets', true)
on conflict (id) do nothing;

drop policy if exists "public_read_hive_assets" on storage.objects;
create policy "public_read_hive_assets" on storage.objects
  for select
  using (
    bucket_id in (
      'student-images', 'team-logos', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

drop policy if exists "admin_insert_hive_assets" on storage.objects;
create policy "admin_insert_hive_assets" on storage.objects
  for insert
  with check (
    public.is_admin() and bucket_id in (
      'student-images', 'team-logos', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

drop policy if exists "admin_update_hive_assets" on storage.objects;
create policy "admin_update_hive_assets" on storage.objects
  for update
  using (
    public.is_admin() and bucket_id in (
      'student-images', 'team-logos', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

drop policy if exists "admin_delete_hive_assets" on storage.objects;
create policy "admin_delete_hive_assets" on storage.objects
  for delete
  using (
    public.is_admin() and bucket_id in (
      'student-images', 'team-logos', 'achievement-icons', 'curriculum-assets',
      'challenge-assets', 'announcement-assets'
    )
  );

-- =============================================================================
-- Realtime
-- =============================================================================
alter table public.teams                replica identity full;
alter table public.students             replica identity full;
alter table public.announcements        replica identity full;
alter table public.daily_challenges      replica identity full;
alter table public.curriculum_modules   replica identity full;
alter table public.achievements         replica identity full;
alter table public.notifications        replica identity full;
alter table public.leaderboard_settings replica identity full;
alter table public.student_challenge_scores replica identity full;
alter table public.team_challenge_scores replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array[
    'teams', 'students', 'announcements', 'daily_challenges', 'curriculum_modules',
    'achievements', 'student_achievements', 'notifications', 'leaderboard_settings',
    'student_challenge_scores', 'team_challenge_scores'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;
