// ArtwinLive iCal feed parser. Eigen mini-parser, geen `node-ical`.
// Spec: RFC 5545. We pakken VEVENT-blokken en extracten UID/SUMMARY/DTSTART/DTEND/LOCATION/DESCRIPTION.

export type ArtwinEvent = {
  uid: string
  summary: string
  startISO: string
  endISO: string
  location?: string
  description?: string
}

function unfold(input: string): string {
  // RFC 5545: regels die beginnen met space/tab horen bij de vorige regel.
  return input.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
}

function decodeText(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function parseDateValue(value: string, params: Record<string, string>): string | null {
  // Forms:
  //   20260508T120000Z          UTC
  //   20260508T120000           floating local
  //   20260508                  date-only
  //   TZID=Europe/Amsterdam:20260508T120000   (in params)
  const tzid = params.TZID
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/)
  if (!m) return null
  const [, y, mo, d, hh, mi, ss, z] = m
  const dateOnly = !hh
  if (dateOnly) {
    return `${y}-${mo}-${d}T00:00:00Z`
  }
  if (z) {
    return `${y}-${mo}-${d}T${hh}:${mi}:${ss}Z`
  }
  if (tzid) {
    // Onbekende TZ — laat als floating in lokaal-string en append "Z" niet.
    // Voor onze use-case (push naar GCal als-is in dezelfde TZ) is dat goed.
    return `${y}-${mo}-${d}T${hh}:${mi}:${ss}`
  }
  // Floating
  return `${y}-${mo}-${d}T${hh}:${mi}:${ss}`
}

function splitProperty(line: string): { name: string; params: Record<string, string>; value: string } | null {
  const colon = line.indexOf(':')
  if (colon === -1) return null
  const left = line.slice(0, colon)
  const value = line.slice(colon + 1)
  const parts = left.split(';')
  const name = parts[0]!.toUpperCase()
  const params: Record<string, string> = {}
  for (let i = 1; i < parts.length; i++) {
    const eq = parts[i]!.indexOf('=')
    if (eq === -1) continue
    params[parts[i]!.slice(0, eq).toUpperCase()] = parts[i]!.slice(eq + 1)
  }
  return { name, params, value }
}

export function parseIcal(raw: string): ArtwinEvent[] {
  const text = unfold(raw)
  const events: ArtwinEvent[] = []
  const lines = text.split(/\r?\n/)
  let inEvent = false
  let cur: Partial<ArtwinEvent> & { _startParams?: Record<string, string>; _endParams?: Record<string, string> } = {}

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      cur = {}
      continue
    }
    if (line === 'END:VEVENT') {
      inEvent = false
      if (cur.uid && cur.summary && cur.startISO && cur.endISO) {
        events.push({
          uid: cur.uid,
          summary: cur.summary,
          startISO: cur.startISO,
          endISO: cur.endISO,
          location: cur.location,
          description: cur.description,
        })
      }
      cur = {}
      continue
    }
    if (!inEvent) continue
    const parsed = splitProperty(line)
    if (!parsed) continue
    const { name, params, value } = parsed
    switch (name) {
      case 'UID':
        cur.uid = value.trim()
        break
      case 'SUMMARY':
        cur.summary = decodeText(value)
        break
      case 'LOCATION':
        cur.location = decodeText(value)
        break
      case 'DESCRIPTION':
        cur.description = decodeText(value)
        break
      case 'DTSTART': {
        const iso = parseDateValue(value, params)
        if (iso) cur.startISO = iso
        break
      }
      case 'DTEND': {
        const iso = parseDateValue(value, params)
        if (iso) cur.endISO = iso
        break
      }
    }
  }

  return events
}

export async function fetchFeed(): Promise<{ ok: boolean; events: ArtwinEvent[]; error?: string }> {
  const { getCredential } = await import('./credentials')
  const dbCred = await getCredential('artwinlive')
  const dbExtra = (dbCred?.extra ?? {}) as { ical_url?: string }
  const url = dbExtra.ical_url || process.env.ARTWINLIVE_ICAL_URL
  if (!url) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[artwinlive:dev] ical-URL ontbreekt — feed-sync overgeslagen')
    }
    return { ok: false, events: [], error: 'ArtwinLive iCal-URL ontbreekt' }
  }
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, events: [], error: `iCal fetch ${res.status}` }
    const text = await res.text()
    const events = parseIcal(text)
    return { ok: true, events }
  } catch (err) {
    return { ok: false, events: [], error: err instanceof Error ? err.message : String(err) }
  }
}
