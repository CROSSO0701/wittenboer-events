-- Wittenboer Events — initial schema
-- Booking-backend voor 8 vaste artiesten + admin (Marnix) + staff toewijzingen.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ===========================================================
-- ENUMS
-- ===========================================================
do $$ begin
  create type user_role as enum ('admin', 'artist', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_source as enum ('artist', 'client', 'artwinlive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'accepted', 'declined', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inquiry_status as enum ('new', 'contacted', 'quoted', 'booked', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_inquiry_status as enum ('new', 'replied', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('email', 'whatsapp', 'sms');
exception when duplicate_object then null; end $$;

-- ===========================================================
-- TABLES
-- ===========================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'artist',
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on profiles (role);

create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  stage_name text not null,
  slug text not null unique,
  genre text,
  bio text,
  photo_url text,
  external_booking_url text,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists artists_active_idx on artists (active, display_order);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  source booking_source not null,
  artist_id uuid references artists(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,

  client_name text,
  client_email text,
  client_phone text,

  event_date date,
  event_start timestamptz,
  event_end timestamptz,
  event_location text,

  fee_cents integer,
  notes text,

  status booking_status not null default 'pending',
  decline_reason text,
  decided_at timestamptz,

  google_event_id text,
  artwinlive_id text unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_artist_idx on bookings (artist_id);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_event_date_idx on bookings (event_date);
create index if not exists bookings_created_by_idx on bookings (created_by);

create table if not exists booking_assignments (
  booking_id uuid not null references bookings(id) on delete cascade,
  staff_id uuid not null references auth.users(id) on delete cascade,
  role_on_job text,
  notification_channel notification_channel not null default 'email',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (booking_id, staff_id)
);
create index if not exists booking_assignments_staff_idx on booking_assignments (staff_id);

create table if not exists disco_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  price_from_cents integer not null,
  guest_capacity_min integer,
  guest_capacity_max integer,
  hero_image_url text,
  features jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  is_popular boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists disco_inquiries (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references disco_packages(id) on delete set null,

  name text not null,
  organisation text,
  email text not null,
  phone text,

  event_date date,
  guest_count integer,
  location text,
  notes text,

  status inquiry_status not null default 'new',
  converted_booking_id uuid references bookings(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists disco_inquiries_status_idx on disco_inquiries (status);

create table if not exists contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status contact_inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_inquiries_status_idx on contact_inquiries (status);

create table if not exists artist_booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete set null,

  name text not null,
  organisation text,
  email text not null,
  phone text,

  event_date date,
  event_location text,
  notes text,

  status inquiry_status not null default 'new',
  converted_booking_id uuid references bookings(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists artist_booking_inquiries_status_idx on artist_booking_inquiries (status);

-- ===========================================================
-- HELPERS (security definer)
-- ===========================================================

create or replace function is_admin() returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_artist() returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'artist'
  );
$$;

create or replace function current_artist_id() returns uuid
language sql security definer set search_path = public
as $$
  select id from artists where profile_id = auth.uid() limit 1;
$$;

-- ===========================================================
-- TRIGGER: touch_updated_at
-- ===========================================================

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger profiles_touch before update on profiles
    for each row execute function touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger bookings_touch before update on bookings
    for each row execute function touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger disco_packages_touch before update on disco_packages
    for each row execute function touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger disco_inquiries_touch before update on disco_inquiries
    for each row execute function touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger contact_inquiries_touch before update on contact_inquiries
    for each row execute function touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger artist_booking_inquiries_touch before update on artist_booking_inquiries
    for each row execute function touch_updated_at();
exception when duplicate_object then null; end $$;
