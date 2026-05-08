-- Wittenboer Events — RLS policies
-- RLS doet het zware werk; handlers vertrouwen erop.

alter table profiles enable row level security;
alter table artists enable row level security;
alter table bookings enable row level security;
alter table booking_assignments enable row level security;
alter table disco_packages enable row level security;
alter table disco_inquiries enable row level security;
alter table contact_inquiries enable row level security;
alter table artist_booking_inquiries enable row level security;

-- ===========================================================
-- profiles
-- ===========================================================
create policy "profiles: own row select" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles: admin insert" on profiles
  for insert with check (is_admin());

create policy "profiles: own row update" on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

create policy "profiles: admin delete" on profiles
  for delete using (is_admin());

-- ===========================================================
-- artists
-- ===========================================================
create policy "artists: public read active" on artists
  for select using (active = true or is_admin() or profile_id = auth.uid());

create policy "artists: admin insert" on artists
  for insert with check (is_admin());

create policy "artists: own bio update or admin" on artists
  for update using (profile_id = auth.uid() or is_admin())
  with check (profile_id = auth.uid() or is_admin());

create policy "artists: admin delete" on artists
  for delete using (is_admin());

-- ===========================================================
-- bookings
-- ===========================================================
create policy "bookings: artist owns or staff assigned or admin" on bookings
  for select using (
    is_admin()
    or artist_id = current_artist_id()
    or created_by = auth.uid()
    or exists (
      select 1 from booking_assignments ba
      where ba.booking_id = bookings.id and ba.staff_id = auth.uid()
    )
  );

create policy "bookings: artist insert own" on bookings
  for insert with check (
    is_admin()
    or (
      is_artist()
      and source = 'artist'
      and artist_id = current_artist_id()
      and created_by = auth.uid()
    )
  );

create policy "bookings: admin update; artist limited" on bookings
  for update using (
    is_admin()
    or (artist_id = current_artist_id() and status = 'pending')
  )
  with check (
    is_admin()
    or (artist_id = current_artist_id() and status = 'pending')
  );

create policy "bookings: admin delete" on bookings
  for delete using (is_admin());

-- ===========================================================
-- booking_assignments
-- ===========================================================
create policy "assignments: own or admin" on booking_assignments
  for select using (staff_id = auth.uid() or is_admin());

create policy "assignments: admin write" on booking_assignments
  for insert with check (is_admin());

create policy "assignments: admin update" on booking_assignments
  for update using (is_admin()) with check (is_admin());

create policy "assignments: admin delete" on booking_assignments
  for delete using (is_admin());

-- ===========================================================
-- disco_packages
-- ===========================================================
create policy "packages: public read active" on disco_packages
  for select using (active = true or is_admin());

create policy "packages: admin write" on disco_packages
  for insert with check (is_admin());
create policy "packages: admin update" on disco_packages
  for update using (is_admin()) with check (is_admin());
create policy "packages: admin delete" on disco_packages
  for delete using (is_admin());

-- ===========================================================
-- *_inquiries — public INSERT, admin SELECT/UPDATE
-- ===========================================================
create policy "disco_inquiries: public insert" on disco_inquiries
  for insert with check (true);
create policy "disco_inquiries: admin read" on disco_inquiries
  for select using (is_admin());
create policy "disco_inquiries: admin update" on disco_inquiries
  for update using (is_admin()) with check (is_admin());
create policy "disco_inquiries: admin delete" on disco_inquiries
  for delete using (is_admin());

create policy "contact_inquiries: public insert" on contact_inquiries
  for insert with check (true);
create policy "contact_inquiries: admin read" on contact_inquiries
  for select using (is_admin());
create policy "contact_inquiries: admin update" on contact_inquiries
  for update using (is_admin()) with check (is_admin());
create policy "contact_inquiries: admin delete" on contact_inquiries
  for delete using (is_admin());

create policy "artist_booking_inquiries: public insert" on artist_booking_inquiries
  for insert with check (true);
create policy "artist_booking_inquiries: admin read" on artist_booking_inquiries
  for select using (is_admin());
create policy "artist_booking_inquiries: admin update" on artist_booking_inquiries
  for update using (is_admin()) with check (is_admin());
create policy "artist_booking_inquiries: admin delete" on artist_booking_inquiries
  for delete using (is_admin());
