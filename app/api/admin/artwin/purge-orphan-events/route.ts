import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { listArtwinTaggedEvents, deleteEventFrom } from '../../../../lib/integrations/google-calendar'

export const maxDuration = 60

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Ruimt wees-events op: Google-events op de actieve agenda die nog door de oude
// Artwin-sync zijn aangemaakt (getagd met artwinliveId) maar waarvan de boeking
// nu 'inkomend' is. Getrottled + retry tegen rate-limiting; idempotent en
// herhaalbaar (lijst wordt elke run opnieuw opgehaald). Auth: admin OF CRON_SECRET.
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
  const list = await listArtwinTaggedEvents(calendarId, `${today}T00:00:00Z`)
  if (!list.ok) return NextResponse.json({ error: 'Listen faalde.', detail: list.error }, { status: 502 })

  // Cap per run zodat we binnen de functietimeout blijven; herhaal tot remaining 0.
  const CAP = 220
  const batch = list.ids.slice(0, CAP)

  let deleted = 0
  let failed = 0
  for (const id of batch) {
    let ok = false
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const res = await deleteEventFrom(calendarId, id)
      ok = !!res?.ok
      if (!ok) await sleep(600 * (attempt + 1)) // backoff bij rate-limit
    }
    if (ok) deleted += 1
    else failed += 1
    await sleep(140) // ~7/s, onder de Google-schrijflimiet
  }

  return NextResponse.json({
    ok: true,
    foundTagged: list.ids.length,
    attempted: batch.length,
    deleted,
    failed,
    remaining: Math.max(0, list.ids.length - deleted),
  })
}
