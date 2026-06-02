import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { createEvent, calendarTitle } from '../../../../lib/integrations/google-calendar'

export const maxDuration = 60

type Row = {
  id: string
  source: string
  client_name: string | null
  event_date: string | null
  event_start: string | null
  event_end: string | null
  event_location: string | null
  notes: string | null
  status: string
}

async function runBatched<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}

// Accepteer Artwin-"inkomend" in bulk: zet de gekozen (of alle) pending
// artwinlive-boekingen op 'accepted' en maakt het Google-event op de actieve
// agenda. Getimed event als er start+eind is, anders hele-dag uit event_date.
// Body: { ids?: string[] }  — geen ids = alle pending artwinlive.
export async function POST(request: Request) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  let body: { ids?: string[] } = {}
  try {
    body = (await request.json().catch(() => ({}))) as { ids?: string[] }
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  let query = supabase
    .from('bookings')
    .select('id, source, client_name, event_date, event_start, event_end, event_location, notes, status')
    .eq('source', 'artwinlive')
    .eq('status', 'pending')
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    query = query.in('id', body.ids)
  }
  const { data, error: selErr } = await query
  if (selErr) return NextResponse.json({ error: 'Database-fout.', detail: selErr.message }, { status: 500 })
  const rows = (data ?? []) as Row[]

  let accepted = 0
  let calendarFailed = 0
  const errors: string[] = []

  await runBatched(rows, 8, async (b) => {
    const summary = calendarTitle({ source: b.source, clientName: b.client_name })
    let googleEventId: string | null = null
    const created =
      b.event_start && b.event_end
        ? await createEvent({
            summary,
            description: b.notes ?? undefined,
            location: b.event_location ?? undefined,
            startISO: b.event_start,
            endISO: b.event_end,
          })
        : b.event_date
          ? await createEvent({
              summary,
              description: b.notes ?? undefined,
              location: b.event_location ?? undefined,
              allDayDate: b.event_date,
            })
          : { ok: false as const, error: 'geen datum' }
    if (created.ok && created.id) googleEventId = created.id
    else {
      calendarFailed += 1
      if (created.error) errors.push(`${b.id}: ${created.error}`)
    }

    const { error: updErr } = await supabase
      .from('bookings')
      .update({
        status: 'accepted',
        decided_at: new Date().toISOString(),
        decided_by: admin.id,
        google_event_id: googleEventId,
      })
      .eq('id', b.id)
      .eq('status', 'pending')
    if (updErr) errors.push(`update ${b.id}: ${updErr.message}`)
    else accepted += 1
  })

  return NextResponse.json({
    ok: true,
    found: rows.length,
    accepted,
    calendarFailed,
    errors: errors.slice(0, 20),
  })
}
