import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './db/types.generated'

// kind onderscheidt de soort botsing zodat de UI ze apart kan tonen/iconen:
//   'artist'      → dezelfde artiest staat al geboekt op die dag
//   'staff'       → een schuiver staat die dag al op een andere booking
//   'klus'        → een schuiver staat die dag al op een klus (op-/afbouw e.d.)
//   'unavailable' → een schuiver is die dag vrij of op vakantie
export type BookingConflict = {
  kind: 'artist' | 'staff' | 'unavailable' | 'klus'
  label: string
  detail: string
}

type Supa = SupabaseClient<Database>

async function staffNameMap(supabase: Supa, staffIds: string[]): Promise<Map<string, string>> {
  if (staffIds.length === 0) return new Map()
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', staffIds)
  return new Map((data ?? []).map((p) => [p.id, p.full_name ?? 'crewlid']))
}

// Gekozen crew die dag al op een (andere) booking?
async function staffBookingConflicts(
  supabase: Supa,
  eventDate: string,
  staffIds: string[],
  excludeBookingId?: string
): Promise<BookingConflict[]> {
  if (staffIds.length === 0) return []
  let q = supabase
    .from('bookings')
    .select('id, client_name, event_location')
    .eq('event_date', eventDate)
    .in('status', ['pending', 'accepted'])
  if (excludeBookingId) q = q.neq('id', excludeBookingId)
  const { data: sameDay } = await q
  const sameDayIds = (sameDay ?? []).map((b) => b.id)
  if (sameDayIds.length === 0) return []

  const { data: clashes } = await supabase
    .from('booking_assignments')
    .select('staff_id, booking_id')
    .in('booking_id', sameDayIds)
    .in('staff_id', staffIds)
  if (!clashes || clashes.length === 0) return []

  const nameById = await staffNameMap(supabase, staffIds)
  const bookingById = new Map((sameDay ?? []).map((b) => [b.id, b]))
  return clashes.map((c) => {
    const b = bookingById.get(c.booking_id)
    return {
      kind: 'staff' as const,
      label: `${nameById.get(c.staff_id) ?? 'Crewlid'} is op ${eventDate} al ingepland`,
      detail: [b?.client_name, b?.event_location].filter(Boolean).join(' · ') || 'andere klus',
    }
  })
}

// Gekozen crew die dag al op een (andere) klus?
async function staffKlusConflicts(
  supabase: Supa,
  eventDate: string,
  staffIds: string[],
  excludeKlusId?: string
): Promise<BookingConflict[]> {
  if (staffIds.length === 0) return []
  let q = supabase.from('klussen').select('id, title, location').eq('event_date', eventDate)
  if (excludeKlusId) q = q.neq('id', excludeKlusId)
  const { data: sameDay } = await q
  const sameDayIds = (sameDay ?? []).map((k) => k.id)
  if (sameDayIds.length === 0) return []

  const { data: clashes } = await supabase
    .from('klus_assignments')
    .select('staff_id, klus_id')
    .in('klus_id', sameDayIds)
    .in('staff_id', staffIds)
  if (!clashes || clashes.length === 0) return []

  const nameById = await staffNameMap(supabase, staffIds)
  const klusById = new Map((sameDay ?? []).map((k) => [k.id, k]))
  return clashes.map((c) => {
    const k = klusById.get(c.klus_id)
    return {
      kind: 'klus' as const,
      label: `${nameById.get(c.staff_id) ?? 'Crewlid'} staat op ${eventDate} al op een klus`,
      detail: [k?.title, k?.location].filter(Boolean).join(' · ') || 'andere klus',
    }
  })
}

// Gekozen crew die dag vrij of op vakantie?
async function staffAvailabilityConflicts(
  supabase: Supa,
  eventDate: string,
  staffIds: string[]
): Promise<BookingConflict[]> {
  if (staffIds.length === 0) return []
  const { data: away } = await supabase
    .from('crew_availability')
    .select('staff_id, kind, note, start_date, end_date')
    .in('staff_id', staffIds)
    .lte('start_date', eventDate)
    .gte('end_date', eventDate)
  if (!away || away.length === 0) return []

  const nameById = await staffNameMap(supabase, staffIds)
  return away.map((a) => {
    const period =
      a.start_date === a.end_date
        ? `op ${a.start_date}`
        : `van ${a.start_date} t/m ${a.end_date}`
    return {
      kind: 'unavailable' as const,
      label: `${nameById.get(a.staff_id) ?? 'Crewlid'} is op ${eventDate} ${a.kind === 'vakantie' ? 'op vakantie' : 'vrij'}`,
      detail: [a.note, period].filter(Boolean).join(' · '),
    }
  })
}

// Precieze dubbelboeking-check op basis van de database — NIET de volledige
// Google-agenda (die zit vol Artwin-gigs en zou bij bijna elke datum alarm
// slaan). Soorten conflicten:
//   1) dezelfde artiest staat al geboekt op die dag,
//   2) een gekozen schuiver staat die dag al op een andere booking of klus,
//   3) een gekozen schuiver is die dag vrij/op vakantie.
export async function findBookingConflicts(
  supabase: Supa,
  opts: {
    bookingId: string
    eventDate: string | null
    artistId?: string | null
    artistName?: string | null
    staffIds?: string[]
  }
): Promise<BookingConflict[]> {
  const { bookingId, eventDate, artistId, artistName, staffIds = [] } = opts
  if (!eventDate) return []
  const conflicts: BookingConflict[] = []

  // 1) Artiest al geboekt op die dag (andere, nog levende boeking)?
  if (artistId) {
    const { data: dupes } = await supabase
      .from('bookings')
      .select('id, client_name, event_location, status')
      .eq('artist_id', artistId)
      .eq('event_date', eventDate)
      .in('status', ['pending', 'accepted'])
      .neq('id', bookingId)
    for (const d of dupes ?? []) {
      conflicts.push({
        kind: 'artist',
        label: `${artistName ?? 'Deze artiest'} staat al geboekt op ${eventDate}`,
        detail: [d.client_name, d.event_location].filter(Boolean).join(' · ') || `andere boeking (${d.status})`,
      })
    }
  }

  // 2/3) Crew-checks (andere booking, klus, vrij/vakantie).
  if (staffIds.length > 0) {
    conflicts.push(...(await staffBookingConflicts(supabase, eventDate, staffIds, bookingId)))
    conflicts.push(...(await staffKlusConflicts(supabase, eventDate, staffIds)))
    conflicts.push(...(await staffAvailabilityConflicts(supabase, eventDate, staffIds)))
  }

  return conflicts
}

// Conflict-check voor een klus: staat de gekozen crew die dag al op een andere
// klus of booking, of is iemand vrij/op vakantie?
export async function findKlusConflicts(
  supabase: Supa,
  opts: { klusId: string; eventDate: string | null; staffIds?: string[] }
): Promise<BookingConflict[]> {
  const { klusId, eventDate, staffIds = [] } = opts
  if (!eventDate || staffIds.length === 0) return []
  const conflicts: BookingConflict[] = []
  conflicts.push(...(await staffKlusConflicts(supabase, eventDate, staffIds, klusId)))
  conflicts.push(...(await staffBookingConflicts(supabase, eventDate, staffIds)))
  conflicts.push(...(await staffAvailabilityConflicts(supabase, eventDate, staffIds)))
  return conflicts
}
