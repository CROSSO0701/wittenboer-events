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
  startISO: string
  endISO: string
  attendees?: string[]
  // Source IDs (artwinlive) zodat we kunnen tracken in extendedProperties
  sourceId?: string
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

  try {
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(env.calendarId)}/events?sendUpdates=none`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startISO, timeZone: env.timezone },
        end: { dateTime: input.endISO, timeZone: env.timezone },
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
