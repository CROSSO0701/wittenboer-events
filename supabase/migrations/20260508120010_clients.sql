create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  phone text,
  notes text,
  first_booking_at date,
  last_booking_at date,
  total_bookings int not null default 0,
  total_value_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_name_idx on public.clients (lower(name));

alter table public.clients enable row level security;

drop policy if exists "clients admin all" on public.clients;
create policy "clients admin all" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.bookings
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists bookings_client_idx on public.bookings (client_id);

create or replace function public.upsert_booking_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_client uuid;
begin
  if NEW.client_email is null or NEW.client_email = '' then
    return NEW;
  end if;

  insert into public.clients (
    email, name, phone, first_booking_at, last_booking_at, total_bookings, total_value_cents
  )
  values (
    lower(NEW.client_email),
    NEW.client_name,
    NEW.client_phone,
    NEW.event_date,
    NEW.event_date,
    1,
    coalesce(NEW.fee_cents, 0)
  )
  on conflict (email) do update set
    name = coalesce(public.clients.name, EXCLUDED.name),
    phone = coalesce(public.clients.phone, EXCLUDED.phone),
    first_booking_at = least(public.clients.first_booking_at, EXCLUDED.first_booking_at),
    last_booking_at = greatest(public.clients.last_booking_at, EXCLUDED.last_booking_at),
    total_bookings = public.clients.total_bookings + 1,
    total_value_cents = public.clients.total_value_cents + coalesce(NEW.fee_cents, 0),
    updated_at = now()
  returning id into resolved_client;

  NEW.client_id := resolved_client;
  return NEW;
end;
$$;

drop trigger if exists bookings_upsert_client on public.bookings;
create trigger bookings_upsert_client
  before insert on public.bookings
  for each row execute function public.upsert_booking_client();
