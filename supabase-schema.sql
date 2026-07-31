create table if not exists public.pps_app_state (
  id text primary key,
  sessions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pps_app_state enable row level security;

drop policy if exists "pps_app_state_public_select" on public.pps_app_state;
drop policy if exists "pps_app_state_public_insert" on public.pps_app_state;
drop policy if exists "pps_app_state_public_update" on public.pps_app_state;

create policy "pps_app_state_public_select"
  on public.pps_app_state
  for select
  to anon
  using (true);

create policy "pps_app_state_public_insert"
  on public.pps_app_state
  for insert
  to anon
  with check (true);

create policy "pps_app_state_public_update"
  on public.pps_app_state
  for update
  to anon
  using (true)
  with check (true);

insert into public.pps_app_state (id, sessions)
values ('main', '[]'::jsonb)
on conflict (id) do nothing;
