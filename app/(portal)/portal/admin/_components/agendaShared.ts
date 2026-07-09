/**
 * Gedeelde types + datum-helpers voor de agenda-weergaven (#kalender).
 *
 * Deze helpers stonden eerst inline in AgendaBoard. Ze zijn hierheen verplaatst
 * zodat de lijst-view, maand-view en week-view exact dezelfde tijdzone-veilige
 * logica delen (geen duplicatie, geen afwijkend gedrag tussen views).
 */

import type { Database } from '../../../../lib/db/types.generated'
import type { KlusRow } from './KlusDialog'
import type { AvailabilityRow } from './CrewAvailabilityDialog'

export type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
  // Crew-toewijzingen worden meegeladen zodat we boekingen per crewlid kunnen
  // kleuren en filteren (zoals klussen dat al doen).
  assignments?: { staff_id: string }[] | null
}
export type Klus = KlusRow & { assignments?: { staff_id: string }[] | null }
export type Availability = AvailabilityRow & { staff?: { full_name: string | null } | null }

export type DayGroup = {
  bookings: Booking[]
  klussen: Klus[]
  availability: Availability[]
}

export function fmtTime(iso?: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function fmtDateHeader(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}

export function isTodayStr(iso: string): boolean {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return d.getTime() === t.getTime()
}

/**
 * Lokale datum-componenten -> YYYY-MM-DD. NIET toISOString() gebruiken: dat is
 * UTC en schuift in tijdzones oost van UTC (bv. Amsterdam) de dag een terug.
 */
export function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Expandeer een datumbereik naar losse YYYY-MM-DD dagen binnen [from, to]. */
export function eachDateInRange(start: string, end: string, from: string, to: string): string[] {
  const lo = start < from ? from : start
  const hi = end > to ? to : end
  if (lo > hi) return []
  const out: string[] = []
  const cur = new Date(`${lo}T00:00:00`)
  const last = new Date(`${hi}T00:00:00`)
  while (cur.getTime() <= last.getTime()) {
    out.push(ymd(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}
