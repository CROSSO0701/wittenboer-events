import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { listEventIds, deleteEventFrom } from '../../../../lib/integrations/google-calendar'

export const maxDuration = 60

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Ruimt wees-events op de actieve agenda op: toekomstige events die door GEEN
// enkele boeking meer geclaimd worden (booking.google_event_id). Ontstaan toen
// de Artwin-gigs naar 'inkomend' werden gezet en hun event-koppeling losliet,
// maar Google's delete-rate-limit niet alles wegkreeg. Getrottled + retry;
// idempotent en herhaalbaar. `?dry=1` telt alleen. Auth: admin OF CRON_SECRET.
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

  const dry = new URL(request.url).searchParams.get('dry') === '1'

  const supabase = createSupabaseAdminClient()
  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('extra')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  const calendarId =
    ((cred?.extra as Record<string, unknown> | null)?.calendar_id as string | undefined) ?? 'primary'

  const today = new Date().toISOString().slice(0, 10)
  const list = await listEventIds(calendarId, `${today}T00:00:00Z`)
  if (!list.ok) return NextResponse.json({ error: 'Listen faalde.', detail: list.error }, { status: 502 })

  // Geldige (geclaimde) event-ids: alles wat nog aan een boeking hangt.
  const { data: claimedRows } = await supabase
    .from('bookings')
    .select('google_event_id')
    .not('google_event_id', 'is', null)
  const claimed = new Set((claimedRows ?? []).map((r) => r.google_event_id as string))

  const orphans = list.ids.filter((id) => !claimed.has(id))

  if (dry) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      totalOnCalendar: list.ids.length,
      claimed: claimed.size,
      orphans: orphans.length,
    })
  }

  const CAP = 200
  const batch = orphans.slice(0, CAP)
  let deleted = 0
  let failed = 0
  for (const id of batch) {
    let ok = false
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const res = await deleteEventFrom(calendarId, id)
      ok = !!res?.ok
      if (!ok) await sleep(700 * (attempt + 1))
    }
    if (ok) deleted += 1
    else failed += 1
    await sleep(140)
  }

  return NextResponse.json({
    ok: true,
    totalOnCalendar: list.ids.length,
    claimed: claimed.size,
    orphansFound: orphans.length,
    attempted: batch.length,
    deleted,
    failed,
    remaining: Math.max(0, orphans.length - deleted),
  })
}
