-- Eén-call admin dashboard stats. Ontwijkt de meerdere HEAD-counts uit
-- PostgREST die individueel naar Supabase calls toe leidden.

create or replace function public.dashboard_stats()
returns table(
  open int,
  this_week int,
  last_week int,
  weekend int,
  staff_planned int
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  today_d date := current_date;
  week_start date := today_d - ((extract(isodow from today_d)::int - 1));
  week_end date := week_start + 7;
  last_week_start date := week_start - 7;
  sat_d date := week_start + 5;
  sun_d date := week_start + 6;
  in_7 date := today_d + 7;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return query
    select
      (select count(*)::int from public.bookings where status = 'pending') as open,
      (select count(*)::int from public.bookings
        where status = 'accepted'
          and event_date >= week_start
          and event_date < week_end) as this_week,
      (select count(*)::int from public.bookings
        where status = 'accepted'
          and event_date >= last_week_start
          and event_date < week_start) as last_week,
      (select count(*)::int from public.bookings
        where status = 'accepted'
          and event_date in (sat_d, sun_d)) as weekend,
      (select count(distinct ba.staff_id)::int
         from public.booking_assignments ba
         join public.bookings b on b.id = ba.booking_id
        where b.event_date >= today_d
          and b.event_date < in_7) as staff_planned;
end;
$$;

revoke all on function public.dashboard_stats() from public;
grant execute on function public.dashboard_stats() to authenticated;
