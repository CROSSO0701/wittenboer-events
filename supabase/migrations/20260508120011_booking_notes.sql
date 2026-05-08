create table if not exists public.booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists booking_notes_booking_idx on public.booking_notes (booking_id, created_at desc);

alter table public.booking_notes enable row level security;

drop policy if exists "notes admin all" on public.booking_notes;
create policy "notes admin all" on public.booking_notes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notes artist read own" on public.booking_notes;
create policy "notes artist read own" on public.booking_notes
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_notes.booking_id
        and (b.artist_id = public.current_artist_id() or b.created_by = auth.uid())
    )
  );

drop policy if exists "notes artist insert own" on public.booking_notes;
create policy "notes artist insert own" on public.booking_notes
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_notes.booking_id
        and (b.artist_id = public.current_artist_id() or b.created_by = auth.uid())
    )
    and author_id = auth.uid()
  );
