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

  if (!profile || profile.role !== 'admin') {
    return new Response('Not found', { status: 404 })
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, client_name, event_date, event_start, event_end, event_location, notes, status, source')
    .eq('status', 'accepted')
    .order('event_date', { ascending: true })

  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Wittenboer Events//Booking Feed//NL')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push('X-WR-CALNAME:Wittenboer · Geaccepteerde klussen')
  lines.push('X-WR-TIMEZONE:Europe/Amsterdam')

  const dtstamp = toICalDate(new Date().toISOString())!

  for (const b of (bookings ?? []) as Array<{
    id: string
    client_name: string | null
    event_date: string | null
    event_start: string | null
    event_end: string | null
    event_location: string | null
    notes: string | null
    source: string
  }>) {
    if (!b.event_date) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${b.id}@wittenboerevents.nl`)
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

    const summary = `[WBE] ${b.client_name ?? '(geen naam)'}`
    lines.push(`SUMMARY:${escapeText(summary)}`)
    if (b.event_location) lines.push(`LOCATION:${escapeText(b.event_location)}`)
    const desc = [b.notes, `Bron: ${b.source}`].filter(Boolean).join('\n')
    if (desc) lines.push(`DESCRIPTION:${escapeText(desc)}`)
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
