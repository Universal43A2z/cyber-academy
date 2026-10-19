-- =====================================================================
-- SECURITY FIXES — role escalation + feedback RLS
-- Run this whole file in the Supabase SQL editor (Dashboard > SQL).
-- Idempotent: safe to run more than once.
--
-- Fixes:
--  (A) profiles: a user could self-promote by PATCHing their own row
--      (no column restriction). Now they may only update safe columns.
--  (B) feedback_reports: policies existed but RLS was never ENABLED, so
--      any authenticated user could read every report. Enable it.
--  (C) handle_new_user: the trigger copied `role` from client-supplied
--      metadata, so anyone could sign up directly via the public signup
--      endpoint with role:"mentor" and bypass the mentor access code.
--      The trigger now ALWAYS creates a mentee; mentors are promoted only
--      by the server after the access code is validated (see pending_grants
--      + the app's otp/verify routes).
--  (D) pending_mentor_grants: server-only table. A row is written only
--      after the mentor access code is checked, and is consumed (deleted)
--      when the account is verified. Unforgeable by the client.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (A) profiles — restrict which columns an authenticated user may update
-- ---------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (full_name, year_level, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- (B) feedback_reports — enable RLS (policies already defined in schema)
-- ---------------------------------------------------------------------
alter table public.feedback_reports enable row level security;

-- ---------------------------------------------------------------------
-- (C) handle_new_user — never trust client metadata for `role`
-- ---------------------------------------------------------------------
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
    'mentee',   -- role is NEVER taken from client-supplied metadata
    nullif(new.raw_user_meta_data ->> 'year_level', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- (D) pending_mentor_grants — server-only, written after access-code check
-- ---------------------------------------------------------------------
create table if not exists public.pending_mentor_grants (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.pending_mentor_grants enable row level security;

-- No policies + no grants => unreachable through PostgREST by anon/authenticated.
-- Only the service_role (used inside server routes) can read/write it.
revoke all on public.pending_mentor_grants from anon, authenticated;
