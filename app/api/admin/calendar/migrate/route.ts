import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { createCalendar, moveEvent } from '../../../../lib/integrations/google-calendar'

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

  // Alle gesyncte events verhuizen van de huidige agenda naar de doel-agenda.
  const { data: rows, error: selErr } = await supabase
    .from('bookings')
    .select('id, google_event_id')
    .not('google_event_id', 'is', null)
  if (selErr) return NextResponse.json({ error: 'Database-fout.', detail: selErr.message }, { status: 500 })

  let moved = 0
  let failed = 0
  const errors: string[] = []
  for (const r of rows ?? []) {
    const res = await moveEvent(r.google_event_id as string, target)
    if (res.ok) moved++
    else {
      failed++
      if (errors.length < 8) errors.push(`${r.id}: ${res.error}`)
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
    moved,
    failed,
    repointed: !updErr,
    repointError: updErr?.message,
    errors,
  })
}
