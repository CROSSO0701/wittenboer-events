-- Per-project integration credentials (Google Calendar refresh-token, ArtwinLive iCal-URL).
-- Vervangt env-vars zodat koppelingen via de admin-UI gebeuren.

create table if not exists public.integration_credentials (
  provider text primary key,
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  extra jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.integration_credentials enable row level security;

drop policy if exists "admin all" on public.integration_credentials;
create policy "admin all" on public.integration_credentials
  for all using (public.is_admin()) with check (public.is_admin());
