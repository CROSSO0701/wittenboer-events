import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import {
  createCalendar,
  createEvent,
  calendarTitle,
  eventExists,
  deleteEventFrom,
} from '../../../../lib/integrations/google-calendar'

export const maxDuration = 300

// Eenmalige migratie: verplaatst alle gesyncte gigs van de huidige Google-agenda
// (Marnix' primaire) naar een aparte "Wittenboer Shows"-agenda en zet het systeem
// daarna op die agenda. IDs blijven behouden (events.move), dus booking-koppelingen
// blijven kloppen en er ontstaan geen duplicaten.
// Auth: admin-sessie OF `Authorization: Bearer <CRON_SECRET>`.
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

  const body = (await request.json().catch(() => ({}))) as { to?: string; summary?: string }
  const supabase = createSupabaseAdminClient()

  // Doel-agenda: meegegeven, of nieuw aanmaken.
  let target = body.to
  if (!target) {
    const created = await createCalendar(body.summary || 'Wittenboer Shows')
    if (!created.ok || !created.id) {
      return NextResponse.json(
        {
          error: 'Aanmaken van de agenda faalde (mogelijk scope). Maak hem handmatig aan en geef "to" mee.',
          detail: created.error,
        },
        { status: 500 }
      )
    }
    target = created.id
  }
  if (!target) return NextResponse.json({ error: 'Geen doel-agenda.' }, { status: 500 })
  const targetCal: string = target

  // Zorg dat elke gig op de doel-agenda staat. Events die al verplaatst zijn
  // (zelfde ID, nu op de doel-agenda) blijven met rust. Events die nog op de
  // primaire agenda staan (bv. niet-verplaatsbaar door attendees) worden FRIS
  // opnieuw aangemaakt op de doel-agenda en de oude kopie wordt verwijderd.
  const { data: rows, error: selErr } = await supabase
    .from('bookings')
    .select('id, google_event_id, source, client_name, event_start, event_end, event_location, notes')
    .not('google_event_id', 'is', null)
  if (selErr) return NextResponse.json({ error: 'Database-fout.', detail: selErr.message }, { status: 500 })

  type Row = {
    id: string
    google_event_id: string | null
    source: string
    client_name: string | null
    event_start: string | null
    event_end: string | null
    event_location: string | null
    notes: string | null
  }

  async function ensureOnTarget(b: Row): Promise<'ok' | 'skipped' | 'failed'> {
    const oldId = b.google_event_id
    if (!oldId) return 'failed'
    if (await eventExists(targetCal, oldId)) return 'skipped' // al op de doel-agenda
    if (!b.event_start || !b.event_end) return 'failed'
    const summary = calendarTitle({ source: b.source, clientName: b.client_name, artistName: null })
    const created = await createEvent({
      summary,
      description: b.notes ?? undefined,
      location: b.event_location ?? undefined,
      startISO: b.event_start,
      endISO: b.event_end,
    })
    if (!created.ok || !created.id) return 'failed'
    await deleteEventFrom('primary', oldId)
    await supabase.from('bookings').update({ google_event_id: created.id }).eq('id', b.id)
    return 'ok'
  }

  let rebuilt = 0
  let skipped = 0
  let failed = 0
  const errors: string[] = []
  const all = (rows ?? []) as Row[]
  const BATCH = 8
  for (let i = 0; i < all.length; i += BATCH) {
    const results = await Promise.all(
      all.slice(i, i + BATCH).map(async (b) => ({ id: b.id, status: await ensureOnTarget(b) }))
    )
    for (const { id, status } of results) {
      if (status === 'ok') rebuilt++
      else if (status === 'skipped') skipped++
      else {
        failed++
        if (errors.length < 8) errors.push(id)
      }
    }
  }

  // Systeem omschakelen naar de nieuwe agenda (toekomstige boekingen + syncs).
  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('extra')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  const newExtra = { ...(((cred?.extra as Record<string, unknown> | null) ?? {})), calendar_id: target }
  const { error: updErr } = await supabase
    .from('integration_credentials')
    .update({ extra: newExtra as never })
    .eq('provider', 'google_calendar')

  return NextResponse.json({
    ok: true,
    target,
    total: rows?.length ?? 0,
    rebuilt,
    skipped,
    failed,
    repointed: !updErr,
    repointError: updErr?.message,
    errors,
  })
}
