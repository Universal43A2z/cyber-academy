-- =====================================================================
-- F1STACKMIND Cyber Academy — Supabase schema
-- Run this whole file in the Supabase SQL editor (Dashboard > SQL > New query)
-- It creates every table, the audit trigger, RLS policies and a security view.
-- The seed data lives in seed.sql (run after this file).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profiles — one row per auth user, created automatically at signup
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text default '',
  role        text not null default 'mentee' check (role in ('mentor', 'mentee')),
  year_level  text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Roles helper (SECURITY DEFINER to avoid RLS recursion). Defined after
-- the profiles table exists because SQL-language functions are validated
-- at creation time.
create or replace function public.is_mentor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'mentor'
  );
$$;

-- Auto-provision profile from the user metadata supplied at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, year_level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'mentee'),
    nullif(new.raw_user_meta_data ->> 'year_level', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Modules — the weekly lessons
-- ---------------------------------------------------------------------
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  week_no     integer not null,
  title       text not null,
  description text,
  content     text not null,
  video_url   text,
  created_by  uuid references auth.users(id) on delete set null,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists modules_week_no_idx on public.modules (week_no);

-- ---------------------------------------------------------------------
-- Module progress — who completed which module
-- ---------------------------------------------------------------------
create table if not exists public.module_progress (
  user_id      uuid references public.profiles(id) on delete cascade,
  module_id    uuid references public.modules(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, module_id)
);

-- ---------------------------------------------------------------------
-- Attendance — one row per mentee per week
-- ---------------------------------------------------------------------
create table if not exists public.attendances (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  week_no    integer not null,
  status     text not null default 'present' check (status in ('present', 'late', 'absent')),
  note       text,
  date       timestamptz not null default now(),
  marked_by  uuid references public.profiles(id) on delete set null,
  unique (user_id, week_no)
);

-- ---------------------------------------------------------------------
-- Quizzes + questions + attempts
-- ---------------------------------------------------------------------
create table if not exists public.quizzes (
  id             uuid primary key default gen_random_uuid(),
  week_no        integer not null,
  title          text not null,
  description    text,
  time_limit_sec integer not null default 600,
  published      boolean not null default true,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid references public.quizzes(id) on delete cascade not null,
  question      text not null,
  options       jsonb not null default '[]'::jsonb,
  correct_index integer not null default 0,
  points        integer not null default 1,
  position      integer not null default 0
);

-- LAYER 3/4: correct answers are only readable through the mentor-gated
-- table. Mentees get the safe view below — again, answers never reach them.
create or replace view public.quiz_questions_public
with (security_invoker = true) as
select id, quiz_id, question, options, position
from public.quiz_questions;

create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  quiz_id     uuid references public.quizzes(id) on delete cascade not null,
  score       integer not null default 0,
  total       integer not null default 0,
  answers     jsonb not null default '[]'::jsonb,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id);

-- ---------------------------------------------------------------------
-- Activity / audit log (Layer 8)
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  email      text,
  action     text not null,
  details    jsonb not null default '{}'::jsonb,
  ip         text,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY  (Layer 4)
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.modules          enable row level security;
alter table public.module_progress  enable row level security;
alter table public.attendances      enable row level security;
alter table public.quizzes          enable row level security;
alter table public.quiz_questions   enable row level security;
alter table public.quiz_attempts    enable row level security;
alter table public.activity_logs    enable row level security;

-- profiles: read own row (mentors read all), update own
create policy "profiles_select_own_or_mentor" on public.profiles
  for select using (id = auth.uid() or public.is_mentor());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- modules: mentees see published only, mentors manage everything
create policy "modules_select_published_or_mentor" on public.modules
  for select using (published is true or public.is_mentor());

create policy "modules_write_mentor" on public.modules
  for all using (public.is_mentor()) with check (public.is_mentor());

-- module progress: personal rows only
create policy "progress_own" on public.module_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- attendance: own rows; mentors read all
create policy "attendance_select_own_or_mentor" on public.attendances
  for select using (user_id = auth.uid() or public.is_mentor());

create policy "attendance_write_own" on public.attendances
  for insert with check (user_id = auth.uid());

-- quizzes: mentees see published only, mentors manage everything
create policy "quizzes_select_published_or_mentor" on public.quizzes
  for select using (published is true or public.is_mentor());

create policy "quizzes_write_mentor" on public.quizzes
  for all using (public.is_mentor()) with check (public.is_mentor());

-- questions: mentors ONLY (answers protected). Mentees use the view.
create policy "questions_select_mentor" on public.quiz_questions
  for select using (public.is_mentor());

create policy "questions_manage_mentor" on public.quiz_questions
  for all using (public.is_mentor()) with check (public.is_mentor());

-- attempts: personal rows; mentors read all
create policy "attempts_select_own_or_mentor" on public.quiz_attempts
  for select using (user_id = auth.uid() or public.is_mentor());

create policy "attempts_insert_own" on public.quiz_attempts
  for insert with check (user_id = auth.uid());

-- audit log: mentors only (defense in depth)
create policy "logs_select_mentor" on public.activity_logs
  for select using (public.is_mentor());

-- =====================================================================
-- Feedback reports — mentees report issues/feedback to the mentor
-- =====================================================================
create table if not exists public.feedback_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_email  text not null,
  subject     text not null,
  message     text not null,
  category    text not null default 'general'
              check (category in ('general', 'bug', 'content', 'suggestion')),
  status      text not null default 'new'
              check (status in ('new', 'in_review', 'resolved')),
  created_at  timestamptz not null default now()
);

create index if not exists feedback_reports_user_id_idx on public.feedback_reports (user_id);
create index if not exists feedback_reports_status_idx  on public.feedback_reports (status);

create policy "feedback_select_own_or_mentor" on public.feedback_reports
  for select using (user_id = auth.uid() or public.is_mentor());

create policy "feedback_insert_own" on public.feedback_reports
  for insert with check (user_id = auth.uid());

create policy "feedback_update_mentor" on public.feedback_reports
  for update using (public.is_mentor()) with check (public.is_mentor());

-- =====================================================================
-- Announcements — mentors broadcast, every authenticated user reads
-- =====================================================================
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  title       text not null,
  body        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.announcements enable row level security;

create index if not exists announcements_created_idx on public.announcements (created_at desc);

create policy "announcements_select_auth" on public.announcements
  for select using (auth.uid() is not null);

create policy "announcements_write_mentor" on public.announcements
  for all using (public.is_mentor()) with check (public.is_mentor());

-- =====================================================================
-- GRANTS
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles        to authenticated;
grant select                    on public.modules               to authenticated;
grant select, insert, update, delete on public.module_progress to authenticated;
grant select, insert, update    on public.attendances           to authenticated;
grant select                    on public.quizzes               to authenticated;
grant select                    on public.quiz_questions_public to authenticated;
grant select, insert            on public.quiz_attempts         to authenticated;
grant select                    on public.activity_logs         to authenticated;
grant select, insert, update    on public.feedback_reports     to authenticated;
grant select                    on public.announcements        to authenticated;
grant insert, update, delete    on public.announcements        to authenticated;
grant execute on function public.is_mentor() to authenticated;