-- Wittenboer Events — klussen + crew-beschikbaarheid
-- Logistieke klussen (opbouw/afbreken/ophalen) met crew-toewijzingen,
-- plus vrij/vakantie-perioden per crewlid. Hergebruikt notification_channel
-- en touch_updated_at() uit de initial schema.

-- ===========================================================
-- ENUMS
-- ===========================================================
do $$ begin
  create type klus_kind as enum ('opbouw', 'afbreken', 'ophalen', 'overig');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_kind as enum ('vrij', 'vakantie');
exception when duplicate_object then null; end $$;

-- ===========================================================
-- TABLES
-- ===========================================================

create table if not exists public.klussen (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind klus_kind not null default 'opbouw',
  event_date date not null,
  event_start timestamptz,
  event_end timestamptz,
  location text,
  notes text,
  booking_id uuid references public.bookings(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists klussen_event_date_idx on public.klussen (event_date);
create index if not exists klussen_booking_idx on public.klussen (booking_id);

create table if not exists public.klus_assignments (
  klus_id uuid not null references public.klussen(id) on delete cascade,
  staff_id uuid not null references auth.users(id) on delete cascade,
  role_on_job text,
  notification_channel notification_channel not null default 'email',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (klus_id, staff_id)
);
create index if not exists klus_assignments_staff_idx on public.klus_assignments (staff_id);

create table if not exists public.crew_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  kind availability_kind not null default 'vrij',
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint crew_availability_range_check check (end_date >= start_date)
);
create index if not exists crew_availability_staff_idx on public.crew_availability (staff_id, start_date);
create index if not exists crew_availability_range_idx on public.crew_availability (start_date, end_date);

-- ===========================================================
-- TRIGGER: touch_updated_at (hergebruikt uit initial schema)
-- ===========================================================
do $$ begin
  create trigger klussen_touch before update on public.klussen
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- ===========================================================
-- RLS
-- ===========================================================
alter table public.klussen enable row level security;
alter table public.klus_assignments enable row level security;
alter table public.crew_availability enable row level security;

-- klussen: admin volledig; crew leest klussen waarop ze staan
drop policy if exists "klussen admin all" on public.klussen;
create policy "klussen admin all" on public.klussen
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "klussen staff read assigned" on public.klussen;
create policy "klussen staff read assigned" on public.klussen
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.klus_assignments ka
      where ka.klus_id = klussen.id and ka.staff_id = auth.uid()
    )
  );

-- klus_assignments: admin schrijft; crew leest eigen rijen (spiegel van booking_assignments)
drop policy if exists "klus_assignments own or admin" on public.klus_assignments;
create policy "klus_assignments own or admin" on public.klus_assignments
  for select using (staff_id = auth.uid() or public.is_admin());

drop policy if exists "klus_assignments admin insert" on public.klus_assignments;
create policy "klus_assignments admin insert" on public.klus_assignments
  for insert with check (public.is_admin());

drop policy if exists "klus_assignments admin update" on public.klus_assignments;
create policy "klus_assignments admin update" on public.klus_assignments
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "klus_assignments admin delete" on public.klus_assignments;
create policy "klus_assignments admin delete" on public.klus_assignments
  for delete using (public.is_admin());

-- crew_availability: admin volledig; crew leest + beheert eigen rijen
drop policy if exists "availability admin all" on public.crew_availability;
create policy "availability admin all" on public.crew_availability
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "availability staff read own" on public.crew_availability;
create policy "availability staff read own" on public.crew_availability
  for select using (staff_id = auth.uid() or public.is_admin());

drop policy if exists "availability staff insert own" on public.crew_availability;
create policy "availability staff insert own" on public.crew_availability
  for insert with check (staff_id = auth.uid() or public.is_admin());

drop policy if exists "availability staff update own" on public.crew_availability;
create policy "availability staff update own" on public.crew_availability
  for update using (staff_id = auth.uid() or public.is_admin())
  with check (staff_id = auth.uid() or public.is_admin());

drop policy if exists "availability staff delete own" on public.crew_availability;
create policy "availability staff delete own" on public.crew_availability
  for delete using (staff_id = auth.uid() or public.is_admin());
