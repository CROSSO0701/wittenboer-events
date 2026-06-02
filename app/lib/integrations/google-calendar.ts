// Google Calendar via fetch. OAuth refresh-token flow.
// Probeert eerst credentials uit DB (integration_credentials), valt terug op env.
// Faalt netjes zonder credentials — return ok:false zodat handlers
// de booking nog steeds kunnen opslaan.

import { getCredential } from './credentials'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API_BASE = 'https://www.googleapis.com/calendar/v3'

type Env = {
  clientId: string
  clientSecret: string
  refreshToken: string
  calendarId: string
  timezone: string
}

async function readConfig(): Promise<Env | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const dbCred = await getCredential('google_calendar')
  const dbExtra = (dbCred?.extra ?? {}) as { calendar_id?: string }

  const refreshToken = dbCred?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN
  const calendarId = dbExtra.calendar_id || process.env.GOOGLE_CALENDAR_ID
  if (!refreshToken || !calendarId) return null

  return {
    clientId,
    clientSecret,
    refreshToken,
    calendarId,
    timezone: process.env.WITTENBOER_TIMEZONE || 'Europe/Amsterdam',
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(env: Env): Promise<string | null> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value

  const body = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    refresh_token: env.refreshToken,
    grant_type: 'refresh_token',
  })
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token: string; expires_in: number }
    cachedToken = {
      value: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    }
    return data.access_token
  } catch {
    return null
  }
}

export type GCalEventInput = {
  summary: string
  description?: string
  location?: string
  startISO?: string
  endISO?: string
  // Hele-dag-event: "YYYY-MM-DD". Gebruikt als er geen start/eind-tijd is.
  allDayDate?: string
  attendees?: string[]
  // Source IDs (artwinlive) zodat we kunnen tracken in extendedProperties
  sourceId?: string
}

// "YYYY-MM-DD" + 1 dag, kale datum (geen tijdzone-truc). Google verwacht voor
// hele-dag-events een exclusieve einddatum (de dag erna).
function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return dt.toISOString().slice(0, 10)
}

export async function createEvent(input: GCalEventInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const env = await readConfig()
  if (!env) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[gcal:dev] would create event:', input.summary)
    }
    return { ok: false, error: 'Google Calendar credentials ontbreken' }
  }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }

  const isAllDay = !(input.startISO && input.endISO) && !!input.allDayDate
  const start = isAllDay
    ? { date: input.allDayDate! }
    : { dateTime: input.startISO, timeZone: env.timezone }
  const end = isAllDay
    ? { date: nextDay(input.allDayDate!) }
    : { dateTime: input.endISO, timeZone: env.timezone }

  try {
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(env.calendarId)}/events?sendUpdates=none`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        location: input.location,
        start,
        end,
        attendees: input.attendees?.map((email) => ({ email })),
        extendedProperties: input.sourceId
          ? { private: { artwinliveId: input.sourceId } }
          : undefined,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Calendar ${res.status}: ${body}` }
    }
    const data = (await res.json()) as { id: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function patchEvent(
  eventId: string,
  patch: Partial<GCalEventInput>
): Promise<{ ok: boolean; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }

  const body: Record<string, unknown> = {}
  if (patch.summary !== undefined) body.summary = patch.summary
  if (patch.description !== undefined) body.description = patch.description
  if (patch.location !== undefined) body.location = patch.location
  if (patch.startISO) body.start = { dateTime: patch.startISO, timeZone: env.timezone }
  if (patch.endISO) body.end = { dateTime: patch.endISO, timeZone: env.timezone }

  try {
    const res = await fetch(
      `${API_BASE}/calendars/${encodeURIComponent(env.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      return { ok: false, error: `Calendar ${res.status}: ${errBody}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function deleteEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }
  try {
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(env.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      return { ok: false, error: `Calendar ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Maakt een nieuwe (secundaire) agenda aan onder het gekoppelde Google-account.
// Vereist de volledige `calendar`-scope; faalt netjes als alleen `calendar.events`.
export async function createCalendar(summary: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }
  try {
    // Idempotent: hergebruik een bestaande agenda met dezelfde naam i.p.v. dupliceren.
    const listRes = await fetch(`${API_BASE}/users/me/calendarList?maxResults=250`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (listRes.ok) {
      const list = (await listRes.json()) as { items?: Array<{ id: string; summary?: string }> }
      const existing = (list.items ?? []).find((c) => c.summary === summary)
      if (existing) return { ok: true, id: existing.id }
    }
    const res = await fetch(`${API_BASE}/calendars`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, timeZone: env.timezone }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Calendar ${res.status}: ${body}` }
    }
    const data = (await res.json()) as { id: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Verplaatst een bestaand event van de huidige (gekoppelde) agenda naar een
// andere agenda van hetzelfde account. Behoudt het event-ID, dus booking-
// koppelingen blijven kloppen.
export async function moveEvent(eventId: string, toCalendarId: string): Promise<{ ok: boolean; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }
  try {
    const params = new URLSearchParams({ destination: toCalendarId, sendUpdates: 'none' })
    const res = await fetch(
      `${API_BASE}/calendars/${encodeURIComponent(env.calendarId)}/events/${encodeURIComponent(eventId)}/move?${params}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Calendar ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

type Overlap = { id: string; summary: string; startISO: string; endISO: string }

export async function listOverlapping(startISO: string, endISO: string): Promise<{ ok: boolean; events: Overlap[]; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, events: [], error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, events: [], error: 'Token refresh faalde' }

  const params = new URLSearchParams({
    timeMin: startISO,
    timeMax: endISO,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '20',
  })
  try {
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(env.calendarId)}/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return { ok: false, events: [], error: `Calendar ${res.status}` }
    }
    const data = (await res.json()) as {
      items?: Array<{ id: string; summary?: string; start?: { dateTime?: string }; end?: { dateTime?: string } }>
    }
    const events: Overlap[] = (data.items ?? [])
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        id: e.id,
        summary: e.summary ?? '(geen titel)',
        startISO: e.start!.dateTime!,
        endISO: e.end!.dateTime!,
      }))
    return { ok: true, events }
  } catch (err) {
    return { ok: false, events: [], error: err instanceof Error ? err.message : String(err) }
  }
}

// Lijst alle events op een agenda (vanaf timeMin) die door de Artwin-sync zijn
// aangemaakt — herkenbaar aan extendedProperties.private.artwinliveId. Pagineert
// volledig. Gebruikt om wees-events op te ruimen.
export async function listArtwinTaggedEvents(
  calendarId: string,
  timeMinISO: string
): Promise<{ ok: boolean; ids: string[]; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, ids: [], error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, ids: [], error: 'Token refresh faalde' }

  const ids: string[] = []
  let pageToken: string | undefined
  try {
    do {
      const params = new URLSearchParams({
        timeMin: timeMinISO,
        singleEvents: 'true',
        maxResults: '250',
        fields: 'nextPageToken,items(id,extendedProperties/private)',
      })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(
        `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return { ok: false, ids, error: `Calendar ${res.status}` }
      const data = (await res.json()) as {
        nextPageToken?: string
        items?: Array<{ id: string; extendedProperties?: { private?: Record<string, string> } }>
      }
      for (const e of data.items ?? []) {
        if (e.extendedProperties?.private?.artwinliveId) ids.push(e.id)
      }
      pageToken = data.nextPageToken
    } while (pageToken)
    return { ok: true, ids }
  } catch (err) {
    return { ok: false, ids, error: err instanceof Error ? err.message : String(err) }
  }
}

// Lijst ALLE event-ids op een agenda vanaf timeMin (gepagineerd). Gebruikt om
// wees-events te vinden: events die door geen enkele boeking meer geclaimd worden.
export async function listEventIds(
  calendarId: string,
  timeMinISO: string
): Promise<{ ok: boolean; ids: string[]; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, ids: [], error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, ids: [], error: 'Token refresh faalde' }

  const ids: string[] = []
  let pageToken: string | undefined
  try {
    do {
      const params = new URLSearchParams({
        timeMin: timeMinISO,
        singleEvents: 'true',
        maxResults: '250',
        fields: 'nextPageToken,items(id)',
      })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(
        `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return { ok: false, ids, error: `Calendar ${res.status}` }
      const data = (await res.json()) as { nextPageToken?: string; items?: Array<{ id: string }> }
      for (const e of data.items ?? []) ids.push(e.id)
      pageToken = data.nextPageToken
    } while (pageToken)
    return { ok: true, ids }
  } catch (err) {
    return { ok: false, ids, error: err instanceof Error ? err.message : String(err) }
  }
}

// Bestaat dit event op de opgegeven agenda? (200 = ja)
export async function eventExists(calendarId: string, eventId: string): Promise<boolean> {
  const env = await readConfig()
  if (!env) return false
  const token = await getAccessToken(env)
  if (!token) return false
  try {
    const res = await fetch(
      `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?fields=id`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return res.status === 200
  } catch {
    return false
  }
}

// Verwijdert een event van een specifieke agenda (404/410 telt als geslaagd).
export async function deleteEventFrom(calendarId: string, eventId: string): Promise<{ ok: boolean }> {
  const env = await readConfig()
  if (!env) return { ok: false }
  const token = await getAccessToken(env)
  if (!token) return { ok: false }
  try {
    const res = await fetch(
      `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    )
    return { ok: res.ok || res.status === 404 || res.status === 410 }
  } catch {
    return { ok: false }
  }
}

// Lijst alle agenda's op het gekoppelde account (id, naam, of we mogen
// schrijven, en of het de hoofdagenda is). Om te kiezen waar de shows heen gaan.
export async function listCalendars(): Promise<{
  ok: boolean
  calendars: Array<{ id: string; summary: string; primary: boolean; accessRole: string }>
  error?: string
}> {
  const env = await readConfig()
  if (!env) return { ok: false, calendars: [], error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, calendars: [], error: 'Token refresh faalde' }
  try {
    const res = await fetch(`${API_BASE}/users/me/calendarList?maxResults=250`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { ok: false, calendars: [], error: `Calendar ${res.status}` }
    const data = (await res.json()) as {
      items?: Array<{ id: string; summary?: string; primary?: boolean; accessRole?: string }>
    }
    return {
      ok: true,
      calendars: (data.items ?? []).map((c) => ({
        id: c.id,
        summary: c.summary ?? '(geen naam)',
        primary: !!c.primary,
        accessRole: c.accessRole ?? '',
      })),
    }
  } catch (err) {
    return { ok: false, calendars: [], error: err instanceof Error ? err.message : String(err) }
  }
}

// Hernoemt een agenda (titel). Werkt op een eigen (secundaire) agenda; de
// primary-agenda kan niet hernoemd worden via de API.
export async function renameCalendar(
  calendarId: string,
  summary: string
): Promise<{ ok: boolean; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }
  try {
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Calendar ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Verwijdert een (secundaire) agenda volledig, inclusief al z'n events. De
// hoofdagenda (primary) kan niet verwijderd worden.
export async function deleteCalendar(calendarId: string): Promise<{ ok: boolean; error?: string }> {
  const env = await readConfig()
  if (!env) return { ok: false, error: 'Google Calendar credentials ontbreken' }
  const token = await getAccessToken(env)
  if (!token) return { ok: false, error: 'Token refresh faalde' }
  try {
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Calendar ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ===========================================================
// Titel-helpers — gedeeld door de Artwin-sync en de staff-toewijzing
// ===========================================================

// ArtwinLive zet "10:00 PM - 11:30 PM " vóór de echte naam. Strip dat: het event
// heeft al een start/eind, dus die tijd in de titel is dubbel én in AM/PM-vorm.
export function cleanArtwinSummary(summary: string): string {
  return summary
    .replace(/^\s*\d{1,2}:\d{2}\s*[AP]M\s*[-–—]\s*\d{1,2}:\d{2}\s*[AP]M\s*/i, '')
    .trim()
}

// Splitst "Dorpsfeesten Aarle-Rixtel (Mikey Wonder Oud)" in evenement + artiest.
function splitArtwinName(name: string): { artist: string | null; event: string | null } {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (m) return { event: m[1]!.trim() || null, artist: m[2]!.trim() || null }
  return { event: name.trim() || null, artist: null }
}

// Agenda-titel-volgorde: artiest → (toegewezen crew) → locatie/evenement.
// Bv. "Mikey Wonder Oud (Glenn) — Dorpsfeesten Aarle-Rixtel".
export function calendarTitle(opts: {
  source: string
  clientName?: string | null
  artistName?: string | null
  staffNames?: string[]
}): string {
  const { source, clientName, artistName, staffNames = [] } = opts
  let artist: string | null
  let event: string | null
  if (source === 'artwinlive') {
    const split = splitArtwinName(clientName ?? '')
    artist = split.artist
    event = split.event
  } else {
    artist = artistName ?? null
    event = clientName ?? null
  }
  let head = (artist ?? '').trim()
  if (staffNames.length > 0) {
    head = head ? `${head} (${staffNames.join(', ')})` : `(${staffNames.join(', ')})`
  }
  const tail = (event ?? '').trim()
  return [head, tail].filter(Boolean).join(' · ') || 'Boeking'
}
