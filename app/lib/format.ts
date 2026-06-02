// Gedeelde formatters en NL-labelmaps voor de admin-portal.
// Eén bron van waarheid — vervangt de losse duplicaten in de _components.

/**
 * Datum t.o.v. vandaag, in mensentaal: "Vandaag" / "Morgen" / "Gisteren",
 * weekdag binnen 7 dagen, anders "5 jun".
 * Gedrag identiek aan de oorspronkelijke implementatie in AanvragenOverzicht.
 */
export function relativeDate(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Vandaag'
  if (diff === 1) return 'Morgen'
  if (diff === -1) return 'Gisteren'
  if (diff > 0 && diff < 7) {
    return new Intl.DateTimeFormat('nl-NL', { weekday: 'long' }).format(d)
  }
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(d)
}

/**
 * Verstreken tijd sinds een tijdstip: "zojuist" / "12 min" / "3 u" / "2 d",
 * anders een korte datum. Gedrag identiek aan AanvragenOverzicht/AdminDashboard.
 */
export function fmtAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'zojuist'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} u`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d`
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

/** Cent-bedrag naar EUR-notatie, of "—" bij ontbrekende waarde. */
export function formatEUR(cents?: number | null): string {
  if (cents == null) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

// ─── Bron van een boeking ────────────────────────────────────────────────
export const SOURCE_LABEL: Record<string, string> = {
  artwinlive: 'Artwin',
  client: 'Klant',
  artist: 'Artiest',
}

/** NL-label voor een booking-source, met fallback op de rauwe waarde. */
export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source
}

// ─── Statuslabels voor aanvragen (Engelse enum → NL) ─────────────────────
// Show-pakket- en artiest-aanvragen delen dezelfde statusset.
export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  new: 'Nieuw',
  contacted: 'Gebeld',
  quoted: 'Offerte uit',
  booked: 'Geboekt',
  closed: 'Afgerond',
}

// Contactaanvragen kennen een eigen, kleinere set.
export const CONTACT_STATUS_LABEL: Record<string, string> = {
  new: 'Nieuw',
  replied: 'Beantwoord',
  closed: 'Afgerond',
}
