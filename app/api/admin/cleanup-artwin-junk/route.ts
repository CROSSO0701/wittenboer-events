import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { deleteEventFrom } from '../../../lib/integrations/google-calendar'

export const maxDuration = 60

// Eenmalige opruiming: verwijdert de iCal-aggregatie-junk die per ongeluk als
// boeking is geimporteerd uit de Artwin-feed ("1 more booking in the night"
// e.d.), inclusief de bijbehorende Google-agenda-events op de actieve agenda.
// De sync filtert deze entries voortaan zelf weg. Auth: admin-sessie OF
// `Authorization: Bearer <CRON_SECRET>`.
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const cronOk = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
  if (!cronOk) {
    try {
      await requireAdmin()
    } catch (err) {
      if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  }

  const supabase = createSupabaseAdminClient()

  // Actieve agenda waar de gesyncte gigs op staan.
  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('extra')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  const calendarId =
    ((cred?.extra as Record<string, unknown> | null)?.calendar_id as string | undefined) ?? 'primary'

  // De junk-boekingen: aggregatie-pseudo-events uit de feed.
  const { data: rows, error: selErr } = await supabase
    .from('bookings')
    .select('id, google_event_id, client_name')
    .eq('source', 'artwinlive')
    .ilike('client_name', '%more booking%in the night%')
  if (selErr) return NextResponse.json({ error: 'Database-fout.', detail: selErr.message }, { status: 500 })

  let calendarDeleted = 0
  let calendarFailed = 0
  for (const b of rows ?? []) {
    if (!b.google_event_id) continue
    const res = await deleteEventFrom(calendarId, b.google_event_id)
    if (res?.ok) calendarDeleted += 1
    else calendarFailed += 1
  }

  const ids = (rows ?? []).map((b) => b.id)
  let rowsDeleted = 0
  if (ids.length > 0) {
    const { error: delErr, count } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .in('id', ids)
    if (delErr) return NextResponse.json({ error: 'Verwijderen faalde.', detail: delErr.message }, { status: 500 })
    rowsDeleted = count ?? ids.length
  }

  return NextResponse.json({
    ok: true,
    found: rows?.length ?? 0,
    calendarDeleted,
    calendarFailed,
    rowsDeleted,
  })
}
