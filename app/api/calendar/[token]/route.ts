import { createSupabaseAdminClient } from '../../../lib/db/server'

const TOKEN_RE = /^[a-f0-9]{24,128}\.ics$/i

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toICalDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  // YYYYMMDDTHHMMSSZ in UTC
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function toICalDateOnly(date: string | null): string | null {
  if (!date) return null
  return date.replace(/-/g, '')
}

function escapeText(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: tokenWithExt } = await params
  if (!TOKEN_RE.test(tokenWithExt)) {
    return new Response('Not found', { status: 404 })
  }
  const token = tokenWithExt.replace(/\.ics$/i, '')

  let supabase
  try {
    supabase = createSupabaseAdminClient()
  } catch {
    return new Response('Service unavailable', { status: 503 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('calendar_feed_token', token)
    .maybeSingle()

  // Alleen admin- en staff-tokens geven een feed. Onbekend token -> 404.
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return new Response('Not found', { status: 404 })
  }

  // Eén genormaliseerd event-type voor bookings én klussen.
  type FeedEvent = {
    uid: string
    title: string
    event_date: string | null
    event_start: string | null
    event_end: string | null
    location: string | null
    description: string | null
  }

  const events: FeedEvent[] = []

  if (profile.role === 'admin') {
    // Admin-feed: alle geaccepteerde bookings (bestaand gedrag).
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, client_name, event_date, event_start, event_end, event_location, notes, status, source')
      .eq('status', 'accepted')
      .order('event_date', { ascending: true })

    for (const b of bookings ?? []) {
      events.push({
        // Bestaand UID-formaat behouden zodat reeds geabonneerde admin-agenda's
        // dezelfde events blijven zien (geen duplicaten).
        uid: `${b.id}@wittenboerevents.nl`,
        title: b.client_name ?? '(geen naam)',
        event_date: b.event_date,
        event_start: b.event_start,
        event_end: b.event_end,
        location: b.event_location,
        description: [b.notes, `Bron: ${b.source}`].filter(Boolean).join('\n') || null,
      })
    }
  } else {
    // Staff-feed: alleen eigen toegewezen bookings + klussen.
    const [bookingRes, klusRes] = await Promise.all([
      supabase
        .from('booking_assignments')
        .select('role_on_job, booking:bookings(id, client_name, event_date, event_start, event_end, event_location, status)')
        .eq('staff_id', profile.id),
      supabase
        .from('klus_assignments')
        .select('role_on_job, klus:klussen(id, title, event_date, event_start, event_end, location, notes)')
        .eq('staff_id', profile.id),
    ])

    for (const row of bookingRes.data ?? []) {
      const b = row.booking
      if (!b) continue
      if (b.status === 'declined' || b.status === 'cancelled') continue
      events.push({
        uid: `${b.id}-booking@wittenboerevents.nl`,
        title: b.client_name ?? 'Show',
        event_date: b.event_date,
        event_start: b.event_start,
        event_end: b.event_end,
        location: b.event_location,
        description: row.role_on_job ? `Rol: ${row.role_on_job}` : null,
      })
    }

    for (const row of klusRes.data ?? []) {
      const k = row.klus
      if (!k) continue
      events.push({
        uid: `${k.id}-klus@wittenboerevents.nl`,
        title: k.title,
        event_date: k.event_date,
        event_start: k.event_start,
        event_end: k.event_end,
        location: k.location,
        description: [row.role_on_job ? `Rol: ${row.role_on_job}` : null, k.notes]
          .filter(Boolean)
          .join('\n') || null,
      })
    }

    events.sort((a, b) => {
      if (!a.event_date) return 1
      if (!b.event_date) return -1
      return a.event_date.localeCompare(b.event_date)
    })
  }

  const calName = profile.role === 'admin' ? 'Wittenboer · Geaccepteerde klussen' : 'Wittenboer · Mijn klussen'

  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Wittenboer Events//Booking Feed//NL')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push(`X-WR-CALNAME:${calName}`)
  lines.push('X-WR-TIMEZONE:Europe/Amsterdam')

  const dtstamp = toICalDate(new Date().toISOString())!

  for (const b of events) {
    if (!b.event_date) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${b.uid}`)
    lines.push(`DTSTAMP:${dtstamp}`)

    if (b.event_start && b.event_end) {
      lines.push(`DTSTART:${toICalDate(b.event_start)}`)
      lines.push(`DTEND:${toICalDate(b.event_end)}`)
    } else {
      // All-day event
      const startD = toICalDateOnly(b.event_date)
      const endDate = new Date(b.event_date)
      endDate.setDate(endDate.getDate() + 1)
      const endD = toICalDateOnly(endDate.toISOString().slice(0, 10))
      lines.push(`DTSTART;VALUE=DATE:${startD}`)
      lines.push(`DTEND;VALUE=DATE:${endD}`)
    }

    const summary = `[WBE] ${b.title}`
    lines.push(`SUMMARY:${escapeText(summary)}`)
    if (b.location) lines.push(`LOCATION:${escapeText(b.location)}`)
    if (b.description) lines.push(`DESCRIPTION:${escapeText(b.description)}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  // RFC 5545 zegt CRLF lijn-endings.
  const body = lines.join('\r\n') + '\r\n'

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Content-Disposition': 'inline; filename="wittenboer.ics"',
    },
  })
}
