import { NextResponse } from 'next/server'
import { AuthError, requireStaff } from '../../../../lib/auth/helpers'
import { createSupabaseServerClient } from '../../../../lib/db/server'

export const dynamic = 'force-dynamic'

// Eén item in de crew-agenda: een booking OF een klus waar dit crewlid
// aan is toegewezen. Genormaliseerd naar één vorm zodat de UI ze samen
// op datum kan sorteren.
export type CrewItem = {
  kind: 'booking' | 'klus'
  id: string
  title: string
  event_date: string | null
  event_start: string | null
  event_end: string | null
  location: string | null
  role_on_job: string | null
}

// GET — eigen toegewezen bookings + klussen. RLS zorgt dat een crewlid enkel
// de eigen rijen ziet (booking_assignments/klus_assignments.staff_id = auth.uid()),
// plus de gekoppelde booking/klus. Nooit de volledige beheerder-agenda.
export async function GET() {
  let user
  try {
    user = await requireStaff()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const supabase = await createSupabaseServerClient()

  const [bookingRes, klusRes] = await Promise.all([
    supabase
      .from('booking_assignments')
      .select(
        'role_on_job, booking:bookings(id, client_name, event_date, event_start, event_end, event_location, status)'
      )
      .eq('staff_id', user.id),
    supabase
      .from('klus_assignments')
      .select(
        'role_on_job, klus:klussen(id, title, event_date, event_start, event_end, location)'
      )
      .eq('staff_id', user.id),
  ])

  if (bookingRes.error) {
    return NextResponse.json({ error: 'Database-fout.', detail: bookingRes.error.message }, { status: 500 })
  }
  if (klusRes.error) {
    return NextResponse.json({ error: 'Database-fout.', detail: klusRes.error.message }, { status: 500 })
  }

  const items: CrewItem[] = []

  for (const row of bookingRes.data ?? []) {
    const b = row.booking
    if (!b) continue
    // Alleen relevant/aankomend werk: geen afgewezen of geannuleerde shows tonen.
    if (b.status === 'declined' || b.status === 'cancelled') continue
    items.push({
      kind: 'booking',
      id: b.id,
      title: b.client_name ?? 'Show',
      event_date: b.event_date,
      event_start: b.event_start,
      event_end: b.event_end,
      location: b.event_location,
      role_on_job: row.role_on_job,
    })
  }

  for (const row of klusRes.data ?? []) {
    const k = row.klus
    if (!k) continue
    items.push({
      kind: 'klus',
      id: k.id,
      title: k.title,
      event_date: k.event_date,
      event_start: k.event_start,
      event_end: k.event_end,
      location: k.location,
      role_on_job: row.role_on_job,
    })
  }

  // Op datum sorteren, aankomend eerst. Items zonder datum achteraan.
  items.sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return a.event_date.localeCompare(b.event_date)
  })

  return NextResponse.json({ ok: true, items })
}
