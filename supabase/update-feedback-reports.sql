-- =====================================================================
-- F1STACKMIND Cyber Academy — run this in the Supabase SQL editor once.
-- Adds the missing `public.feedback_reports` table (mentee feedback).
-- Idempotent: safe to run more than once.
--
-- Why: the feedback_submit API returns "Could not submit feedback."
-- because this table is absent from the live database.
-- =====================================================================

-- Mentor helper used by the RLS policies below.
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

alter table public.feedback_reports enable row level security;

create index if not exists feedback_reports_user_id_idx on public.feedback_reports (user_id);
create index if not exists feedback_reports_status_idx  on public.feedback_reports (status);

-- Mentees read only their own reports; mentors read everything.
drop policy if exists "feedback_select_own_or_mentor" on public.feedback_reports;
create policy "feedback_select_own_or_mentor" on public.feedback_reports
  for select using (user_id = auth.uid() or public.is_mentor());

-- Mentees create their own reports only.
drop policy if exists "feedback_insert_own" on public.feedback_reports;
create policy "feedback_insert_own" on public.feedback_reports
  for insert with check (user_id = auth.uid());

-- Only mentors update status/notes.
drop policy if exists "feedback_update_mentor" on public.feedback_reports;
create policy "feedback_update_mentor" on public.feedback_reports
  for update using (public.is_mentor()) with check (public.is_mentor());