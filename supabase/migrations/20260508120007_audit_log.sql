-- Append-only audit log voor admin-acties.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_recent_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "admin reads" on public.audit_log;
create policy "admin reads" on public.audit_log
  for select using (public.is_admin());

drop policy if exists "admin inserts" on public.audit_log;
create policy "admin inserts" on public.audit_log
  for insert with check (public.is_admin());
