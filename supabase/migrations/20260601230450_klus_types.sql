-- Wittenboer Events — beheerbare klus-types
-- Vervangt de vaste klus_kind-enum door een door de admin beheerbare lijst
-- (klus_types) + vrije tekst op klussen.kind. De enum klus_kind blijft staan
-- (ongebruikt) zodat bestaande migraties niet breken.

-- ===========================================================
-- TABLE: klus_types
-- ===========================================================
create table if not exists public.klus_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists klus_types_sort_idx on public.klus_types (sort_order);

-- ===========================================================
-- RLS: admin volledig; ingelogde users mogen active types lezen
-- ===========================================================
alter table public.klus_types enable row level security;

drop policy if exists "klus_types admin all" on public.klus_types;
create policy "klus_types admin all" on public.klus_types
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "klus_types read active" on public.klus_types;
create policy "klus_types read active" on public.klus_types
  for select using (active or public.is_admin());

-- ===========================================================
-- SEED: vier standaard-types (gecapitaliseerd — label wordt direct getoond)
-- ===========================================================
insert into public.klus_types (label, sort_order)
values
  ('Opbouw', 0),
  ('Afbreken', 1),
  ('Ophalen', 2),
  ('Overig', 3)
on conflict (label) do nothing;

-- ===========================================================
-- klussen.kind: enum -> text (default 'Opbouw')
-- 0 rijen, dus de cast is veilig. Eerst default droppen, dan casten,
-- dan nieuwe text-default zetten.
-- ===========================================================
alter table public.klussen alter column kind drop default;
alter table public.klussen alter column kind type text using kind::text;
alter table public.klussen alter column kind set default 'Opbouw';
