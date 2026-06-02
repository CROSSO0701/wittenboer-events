import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { listCalendars, deleteCalendar } from '../../../../lib/integrations/google-calendar'

export const dynamic = 'force-dynamic'

// Auth: admin-sessie OF Bearer CRON_SECRET. Geeft null terug als toegestaan,
// anders een fout-Response.
async function authorize(request: Request): Promise<NextResponse | null> {
  const auth = request.headers.get('authorization')
  if (!!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return null
  try {
    await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }
  return null
}

function activeCalendarId(cred: { extra: unknown } | null): string {
  return ((cred?.extra as Record<string, unknown> | null)?.calendar_id as string | undefined) ?? 'primary'
}

// GET: toon alle agenda's op het gekoppelde account + welke nu actief is.
export async function GET(request: Request) {
  const deny = await authorize(request)
  if (deny) return deny
  const supabase = createSupabaseAdminClient()
  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('extra')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  const list = await listCalendars()
  return NextResponse.json({
    ok: list.ok,
    active: activeCalendarId(cred),
    calendars: list.calendars,
    error: list.error,
  })
}

// POST: { action: 'set-active', calendarId }  -> zet de actieve agenda.
//       { action: 'delete-calendar', calendarId } -> verwijdert die agenda (incl. events).
export async function POST(request: Request) {
  const deny = await authorize(request)
  if (deny) return deny
  const body = (await request.json().catch(() => ({}))) as { action?: string; calendarId?: string }
  const supabase = createSupabaseAdminClient()

  if (body.action === 'set-active' && body.calendarId) {
    const { data: cred } = await supabase
      .from('integration_credentials')
      .select('extra')
      .eq('provider', 'google_calendar')
      .maybeSingle()
    const extra = { ...((cred?.extra as Record<string, unknown> | null) ?? {}), calendar_id: body.calendarId }
    const { error } = await supabase
      .from('integration_credentials')
      .update({ extra })
      .eq('provider', 'google_calendar')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, active: body.calendarId })
  }

  if (body.action === 'delete-calendar' && body.calendarId) {
    const res = await deleteCalendar(body.calendarId)
    return NextResponse.json({ ok: res.ok, error: res.error })
  }

  return NextResponse.json(
    { error: 'Onbekende actie. Gebruik action=set-active of delete-calendar met calendarId.' },
    { status: 400 }
  )
}
