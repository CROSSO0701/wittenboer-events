-- Backend hardening and schema reconciliation.
-- Server routes use the service role for all writes to protected tables.

alter table public.profiles
  add column if not exists archived_at timestamptz,
  add column if not exists google_calendar_id text,
  add column if not exists login_link_token text unique,
  add column if not exists login_link_expires_at timestamptz;

alter table public.booking_assignments
  add column if not exists google_event_id text;

alter table public.klussen
  add column if not exists google_event_id text;

alter table public.klus_assignments
  add column if not exists google_event_id text;

drop policy if exists "profiles: own row update" on public.profiles;
drop policy if exists "profiles: admin update" on public.profiles;
create policy "profiles: admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "artists: own bio update or admin" on public.artists;
drop policy if exists "artists: admin update" on public.artists;
create policy "artists: admin update" on public.artists
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bookings: admin update; artist limited" on public.bookings;
drop policy if exists "bookings: admin update" on public.bookings;
create policy "bookings: admin update" on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "disco_inquiries: public insert" on public.disco_inquiries;
drop policy if exists "contact_inquiries: public insert" on public.contact_inquiries;
drop policy if exists "artist_booking_inquiries: public insert" on public.artist_booking_inquiries;

revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.artists from anon, authenticated;
revoke insert, update, delete on public.bookings from anon, authenticated;
revoke insert on public.disco_inquiries from anon, authenticated;
revoke insert on public.contact_inquiries from anon, authenticated;
revoke insert on public.artist_booking_inquiries from anon, authenticated;
revoke all on public.integration_credentials from anon, authenticated;

revoke select on public.profiles from anon, authenticated;
grant select (
  id,
  role,
  full_name,
  phone,
  email,
  created_at,
  updated_at,
  has_password,
  archived_at,
  google_calendar_id
) on public.profiles to authenticated;

create or replace function public.ensure_calendar_feed_token()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_token text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select calendar_feed_token into current_token
  from public.profiles
  where id = auth.uid();

  if current_token is null then
    update public.profiles
    set calendar_feed_token = encode(extensions.gen_random_bytes(24), 'hex')
    where id = auth.uid()
    returning calendar_feed_token into current_token;
  end if;

  return current_token;
end;
$$;

revoke all on function public.ensure_calendar_feed_token() from public, anon;
grant execute on function public.ensure_calendar_feed_token() to authenticated;
