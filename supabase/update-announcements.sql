-- F1STACKMIND Cyber Academy — announcements
-- Run this once in the Supabase SQL editor (idempotent, safe to re-run).

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

grant select on public.announcements to authenticated;
grant insert, update, delete on public.announcements to authenticated;