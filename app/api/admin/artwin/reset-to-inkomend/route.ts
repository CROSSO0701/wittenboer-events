import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { deleteEventFrom } from '../../../../lib/integrations/google-calendar'

export const maxDuration = 60

type Row = { id: string; google_event_id: string | null }

async function runBatched<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}

// Eenmalig: haal de al automatisch geaccepteerde Artwin-gigs (toekomst) van de
// agenda af en zet ze terug op 'pending' ("inkomend"), zodat ze via de nieuwe
// flow door Marnix' inbox lopen. Verwijdert hun Google-events van de actieve
// agenda. Auth: admin-sessie OF Bearer CRON_SECRET.
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

  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('extra')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  const calendarId =
    ((cred?.extra as Record<string, unknown> | null)?.calendar_id as string | undefined) ?? 'primary'

  const today = new Date().toISOString().slice(0, 10)
  const { data, error: selErr } = await supabase
    .from('bookings')
    .select('id, google_event_id')
    .eq('source', 'artwinlive')
    .eq('status', 'accepted')
    .gte('event_date', today)
  if (selErr) return NextResponse.json({ error: 'Database-fout.', detail: selErr.message }, { status: 500 })
  const rows = (data ?? []) as Row[]

  let calendarDeleted = 0
  let calendarFailed = 0
  await runBatched(rows, 8, async (b) => {
    if (!b.google_event_id) return
    const res = await deleteEventFrom(calendarId, b.google_event_id)
    if (res?.ok) calendarDeleted += 1
    else calendarFailed += 1
  })

  const ids = rows.map((r) => r.id)
  let reset = 0
  if (ids.length > 0) {
    const { error: updErr, count } = await supabase
      .from('bookings')
      .update({ status: 'pending', google_event_id: null, decided_at: null, decided_by: null }, { count: 'exact' })
      .in('id', ids)
    if (updErr) return NextResponse.json({ error: 'Bijwerken faalde.', detail: updErr.message }, { status: 500 })
    reset = count ?? ids.length
  }

  return NextResponse.json({ ok: true, found: rows.length, reset, calendarDeleted, calendarFailed })
}
