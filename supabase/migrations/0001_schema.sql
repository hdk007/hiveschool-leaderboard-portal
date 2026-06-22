-- =============================================================================
-- HiveSchool Leaderboard Portal — 0001 Schema
-- Tables, enums, and indexes.
-- Run this first in the Supabase SQL Editor (or via `supabase db push`).
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto (available by default on Supabase).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
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
-- Passwords are NEVER stored here — Supabase Auth (auth.users) manages the
-- encrypted password. This table only answers "is this uid an admin?".
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text default 'HiveSchool Admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
create table if not exists public.students (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  email                  text not null unique,
  phone                  text,
  profile_image          text,
  batch                  text not null default 'Batch A',
  revenue_generated      numeric(14,2) not null default 0,
  assignments_completed  integer not null default 0,
  attendance_percentage  numeric(5,2) not null default 0 check (attendance_percentage >= 0 and attendance_percentage <= 100),
  challenge_score        numeric(8,2) not null default 0,
  -- Derived / leaderboard columns (maintained by recalculate_leaderboard())
  final_score            numeric(8,2) not null default 0,
  rank                   integer,
  previous_rank          integer,
  growth_percentage      numeric(6,2) not null default 0,
  notes                  text,
  status                 student_status not null default 'active',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_students_rank on public.students (rank);
create index if not exists idx_students_batch on public.students (batch);
create index if not exists idx_students_final_score on public.students (final_score desc);
create index if not exists idx_students_status on public.students (status);

-- -----------------------------------------------------------------------------
-- leaderboard_settings (single configurable row of ranking weights)
-- Weights are stored as fractions and must sum to 1.0.
-- -----------------------------------------------------------------------------
create table if not exists public.leaderboard_settings (
  id                 uuid primary key default gen_random_uuid(),
  revenue_weight     numeric(4,3) not null default 0.40,
  assignment_weight  numeric(4,3) not null default 0.25,
  attendance_weight  numeric(4,3) not null default 0.20,
  challenge_weight   numeric(4,3) not null default 0.15,
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
  topics                 jsonb not null default '[]'::jsonb,   -- array of strings
  assignments            jsonb not null default '[]'::jsonb,   -- array of strings
  resources              jsonb not null default '[]'::jsonb,   -- array of { label, url }
  duration               text,                                 -- e.g. "2 weeks"
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
-- weekly_challenges
-- -----------------------------------------------------------------------------
create table if not exists public.weekly_challenges (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  points              integer not null default 100,
  deadline            timestamptz,
  status              challenge_status not null default 'upcoming',
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
  icon         text not null default 'Award',  -- lucide-react icon name
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
-- challenge_participants
-- -----------------------------------------------------------------------------
create table if not exists public.challenge_participants (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.weekly_challenges(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  score         numeric(8,2) not null default 0,
  status        text not null default 'joined',
  created_at    timestamptz not null default now(),
  unique (challenge_id, student_id)
);

create index if not exists idx_challenge_participants_challenge on public.challenge_participants (challenge_id);

-- -----------------------------------------------------------------------------
-- leaderboard_history (periodic snapshots for trend / growth analytics)
-- -----------------------------------------------------------------------------
create table if not exists public.leaderboard_history (
  id                     uuid primary key default gen_random_uuid(),
  student_id             uuid not null references public.students(id) on delete cascade,
  rank                   integer,
  previous_rank          integer,
  final_score            numeric(8,2) not null default 0,
  revenue_generated      numeric(14,2) not null default 0,
  attendance_percentage  numeric(5,2) not null default 0,
  snapshot_at            timestamptz not null default now()
);

create index if not exists idx_history_student on public.leaderboard_history (student_id, snapshot_at desc);

-- -----------------------------------------------------------------------------
-- notifications (notification center feed)
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'info',     -- info | announcement | challenge | achievement | student
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
  action        text not null,           -- created | updated | deleted | login | recalculated
  performed_by  text,                     -- admin email
  entity_type   text,                     -- student | announcement | challenge | ...
  entity_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_activity_created on public.activity_logs (created_at desc);
