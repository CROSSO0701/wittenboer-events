import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { deleteEventFrom } from '../../../lib/integrations/google-calendar'

export const maxDuration = 60

type Row = {
  id: string
  client_name: string | null
  event_date: string | null
  event_start: string | null
  event_location: string | null
  google_event_id: string | null
  created_at: string
}

const isOud = (n: string | null) => /\sOud\)\s*$/.test(n ?? '')
const baseName = (n: string | null) => (n ?? '').replace(/\s*Oud\)\s*$/, ')').trim()

// Eenmalige ontdubbeling van Artwin-gigs die dubbel binnenkwamen: (a) een
// "… Oud"-variant naast de gewone naam (Artwin heeft die act dubbel in de
// agenda), en (b) exacte dubbele feed-entries. Houdt per gig (datum + tijd +
// locatie) één rij over — bij voorkeur de gewone naam, anders de oudste — en
// verwijdert de rest inclusief hun Google-agenda-events. De sync slaat zulke
// entries voortaan zelf over. Auth: admin-sessie OF Bearer CRON_SECRET.
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

  const today = new Date().toISOString().slice(0, 10)
  const { data, error: selErr } = await supabase
    .from('bookings')
    .select('id, client_name, event_date, event_start, event_location, google_event_id, created_at')
    .eq('source', 'artwinlive')
    .gte('event_date', today)
    .order('created_at', { ascending: true })
  if (selErr) return NextResponse.json({ error: 'Database-fout.', detail: selErr.message }, { status: 500 })
  const rows = (data ?? []) as Row[]

  // Groepeer per gig op datum + genormaliseerde naam ("Oud" weg). Bewust NIET
  // op tijd/locatie: Artwin's dubbele profielen geven dezelfde gig soms met een
  // net andere starttijd of locatie-spelling, dus die zouden de match breken.
  const groups = new Map<string, Row[]>()
  for (const r of rows) {
    const key = [r.event_date, baseName(r.client_name)].join('|')
    const arr = groups.get(key)
    if (arr) arr.push(r)
    else groups.set(key, [r])
  }

  // Per groep met >1 rij: houd de beste (gewone naam vóór "Oud"; bij gelijk de
  // oudste — rijen staan al op created_at asc, sort is stabiel), verwijder de rest.
  const toRemove: Row[] = []
  for (const g of groups.values()) {
    if (g.length < 2) continue
    const sorted = [...g].sort((a, b) => (isOud(a.client_name) ? 1 : 0) - (isOud(b.client_name) ? 1 : 0))
    toRemove.push(...sorted.slice(1))
  }

  let calendarDeleted = 0
  let calendarFailed = 0
  for (const b of toRemove) {
    if (!b.google_event_id) continue
    const res = await deleteEventFrom(calendarId, b.google_event_id)
    if (res?.ok) calendarDeleted += 1
    else calendarFailed += 1
  }

  const ids = toRemove.map((b) => b.id)
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
    groupsScanned: groups.size,
    duplicatesFound: toRemove.length,
    removed: toRemove.map((b) => b.client_name),
    calendarDeleted,
    calendarFailed,
    rowsDeleted,
  })
}
