import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './db/types.generated'

export type BookingConflict = { kind: 'artist' | 'staff'; label: string; detail: string }

// Precieze dubbelboeking-check op basis van de database — NIET de volledige
// Google-agenda (die zit vol Artwin-gigs en zou bij bijna elke datum alarm
// slaan). Twee soorten conflicten:
//   1) dezelfde artiest staat al geboekt op die dag,
//   2) een gekozen schuiver staat die dag al op een andere klus.
export async function findBookingConflicts(
  supabase: SupabaseClient<Database>,
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

  // 2) Gekozen schuiver staat die dag al op een andere klus?
  if (staffIds.length > 0) {
    const { data: sameDay } = await supabase
      .from('bookings')
      .select('id, client_name, event_location')
      .eq('event_date', eventDate)
      .in('status', ['pending', 'accepted'])
      .neq('id', bookingId)
    const sameDayIds = (sameDay ?? []).map((b) => b.id)
    if (sameDayIds.length > 0) {
      const { data: clashes } = await supabase
        .from('booking_assignments')
        .select('staff_id, booking_id')
        .in('booking_id', sameDayIds)
        .in('staff_id', staffIds)
      if (clashes && clashes.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', staffIds)
        const nameById = new Map((profs ?? []).map((p) => [p.id, p.full_name ?? 'crewlid']))
        const bookingById = new Map((sameDay ?? []).map((b) => [b.id, b]))
        for (const c of clashes) {
          const b = bookingById.get(c.booking_id)
          conflicts.push({
            kind: 'staff',
            label: `${nameById.get(c.staff_id) ?? 'Crewlid'} is op ${eventDate} al ingepland`,
            detail: [b?.client_name, b?.event_location].filter(Boolean).join(' · ') || 'andere klus',
          })
        }
      }
    }
  }

  return conflicts
}
