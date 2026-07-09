'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarPlus, FileText, Eye, Calendar as CalendarIcon, Clock, MapPin, Phone, MessageSquare } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog'
import { SubmitBookingForm } from './SubmitBookingForm'
import { Badge } from '../../../../components/ui/badge'
import type { Database } from '../../../../lib/db/types.generated'

type Booking = Database['public']['Tables']['bookings']['Row']

function formatDate(d?: string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(d))
}

function formatTime(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  }).format(date)
}

// Showtijden leesbaar maken: "20:00 - 01:00", of alleen het begin als het eind
// ontbreekt. Zonder tijden tonen we niets (de aanroeper toont dan "hele dag").
function formatShowtimes(start?: string | null, end?: string | null): string | null {
  const s = formatTime(start)
  const e = formatTime(end)
  if (s && e) return `${s} - ${e}`
  if (s) return s
  if (e) return e
  return null
}

// De extra velden (prikken/opbouwen, begane grond/verdieping, verhard pad) staan
// als leesbaar tekstblok bovenaan notes, gescheiden van de vrije bijzonderheden
// door een lege regel. We splitsen dat blok van de bijzonderheden zodat we ze
// netjes apart kunnen tonen. Herkennen doen we aan de bekende labels.
const DETAIL_PREFIXES = [
  'prikken of opbouwen:',
  'begane grond of verdieping:',
  'verhard pad naar het optreden:',
]

function isDetailLine(line: string): boolean {
  const lower = line.trim().toLowerCase()
  return DETAIL_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

function splitNotes(notes?: string | null): { details: string[]; extra: string | null } {
  if (!notes) return { details: [], extra: null }
  const lines = notes.split('\n')
  const details: string[] = []
  let firstExtraIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (isDetailLine(line)) {
      details.push(line.trim())
    } else if (line.trim().length > 0) {
      // Eerste niet-lege, niet-detail regel: hier begint de vrije tekst.
      firstExtraIndex = i
      break
    }
  }
  const extra =
    firstExtraIndex >= 0 ? lines.slice(firstExtraIndex).join('\n').trim() || null : null
  return { details, extra }
}

const ARTIST_STATUS_LABEL: Record<string, string> = {
  pending: 'Aangevraagd',
  accepted: 'Geaccepteerd, ingepland',
  declined: 'Afgewezen',
  cancelled: 'Geannuleerd',
  done: 'Geweest',
}
const ARTIST_STATUS_TONE: Record<string, 'pending' | 'accepted' | 'declined' | 'done' | 'cancelled' | 'neutral'> = {
  pending: 'pending',
  accepted: 'accepted',
  declined: 'declined',
  cancelled: 'cancelled',
  done: 'done',
}

function ArtistStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={ARTIST_STATUS_TONE[status] ?? 'neutral'}>
      {ARTIST_STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

function parseNeeds(notes?: string | null): string[] {
  if (!notes) return []
  const line = notes
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith('nodig:'))
  if (!line) return []
  return line
    .slice(line.indexOf(':') + 1)
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ArtistDashboard({
  stageName,
  hasArtistRow,
}: {
  stageName: string
  hasArtistRow: boolean
}) {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Booking | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/artist/bookings', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Status ${res.status}`)
      }
      const data = (await res.json()) as { bookings: Booking[] }
      setBookings(data.bookings ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    if (!bookings) return { open: 0, comingMonth: 0, total: 0 }
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const monthOut = new Date(now)
    monthOut.setDate(now.getDate() + 30)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    let open = 0
    let comingMonth = 0
    let total = 0
    for (const b of bookings) {
      if (b.status === 'pending') open++
      if (b.event_date) {
        const d = new Date(b.event_date)
        if (b.status === 'accepted' && d >= now && d <= monthOut) comingMonth++
        if (d >= yearStart) total++
      }
    }
    return { open, comingMonth, total }
  }, [bookings])

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-[var(--color-fg)]">
            Hoi {stageName}, welkom in jouw portaal.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-fg-muted)]">
            Heb je geluid, licht of begeleiding nodig voor je volgende show? Vraag het hier aan.
          </p>
        </div>
        {hasArtistRow && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <CalendarPlus size={16} /> Nieuwe aanvraag
              </Button>
            </DialogTrigger>
            <DialogContent wide>
              <DialogHeader>
                <DialogTitle>Aanvraag voor je show</DialogTitle>
                <DialogDescription>
                  Vul de gegevens van je show in. We ontvangen je aanvraag direct en koppelen
                  binnen één werkdag terug.
                </DialogDescription>
              </DialogHeader>
              <SubmitBookingForm
                onSuccess={() => {
                  setOpen(false)
                  load()
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </header>

      {!hasArtistRow && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Je account is nog niet als artiest geactiveerd. Neem contact op via 06 27 17 28 76,
          dan zetten we het voor je klaar.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Wacht op antwoord" value={stats.open} sub="in behandeling" />
        <Stat label="Komende maand" value={stats.comingMonth} sub="ingepland" />
        <Stat label="Dit jaar" value={stats.total} sub="aanvragen" />
      </div>

      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
            Mijn aanvragen
          </h2>
          {bookings && (
            <span className="text-xs text-[var(--color-fg-muted)]">{bookings.length} totaal</span>
          )}
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {bookings && bookings.length === 0 && <ArtistEmpty onOpen={() => setOpen(true)} />}

        {bookings === null && (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
              >
                <div className="h-4 w-20 rounded bg-[var(--color-surface-1)]" />
                <div className="h-4 w-32 rounded bg-[var(--color-surface-1)]" />
                <div className="ml-auto h-4 w-16 rounded bg-[var(--color-surface-1)]" />
              </div>
            ))}
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                  <th className="px-4 py-2">Datum show</th>
                  <th className="px-4 py-2">Locatie</th>
                  <th className="px-4 py-2">Wat heb je nodig</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">
                    <span className="sr-only">Bekijk</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const needs = parseNeeds(b.notes)
                  const declineReason =
                    b.status === 'declined' && b.decline_reason ? b.decline_reason : null
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                    >
                      <td className="px-4 py-3 text-[var(--color-fg)]">{formatDate(b.event_date)}</td>
                      <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                        {b.event_location ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                        {needs.length === 0 ? (
                          <span className="text-[var(--color-fg-muted)]">-</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {needs.map((n) => (
                              <span
                                key={n}
                                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-1)] px-2 py-0.5 text-[11px] text-[var(--color-fg)]"
                              >
                                {n}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ArtistStatusBadge status={b.status} />
                        {declineReason && (
                          <p className="mt-1.5 text-xs text-[var(--color-fg-muted)]">
                            Reden: {declineReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(b)
                          }}
                        >
                          <Eye size={16} /> Bekijk
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </section>

      <BookingDetailDialog booking={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function BookingDetailDialog({
  booking,
  onClose,
}: {
  booking: Booking | null
  onClose: () => void
}) {
  const showtimes = booking ? formatShowtimes(booking.event_start, booking.event_end) : null
  const { details, extra } = splitNotes(booking?.notes)
  const declineReason =
    booking && booking.status === 'declined' && booking.decline_reason
      ? booking.decline_reason
      : null

  return (
    <Dialog open={booking !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {booking && (
          <>
            <DialogHeader>
              <DialogTitle>Jouw aanvraag</DialogTitle>
              <DialogDescription>Alle gegevens van deze aanvraag op een rij.</DialogDescription>
            </DialogHeader>

            <dl className="flex flex-col gap-4">
              <DetailRow icon={<CalendarIcon size={16} />} label="Datum">
                {formatDate(booking.event_date)}
              </DetailRow>

              <DetailRow icon={<Clock size={16} />} label="Showtijden">
                {showtimes ?? 'Hele dag'}
              </DetailRow>

              <DetailRow icon={<MapPin size={16} />} label="Locatie">
                {booking.event_location ?? '-'}
              </DetailRow>

              <DetailRow icon={<Phone size={16} />} label="Telefoon contactpersoon">
                {booking.client_phone ? (
                  <a
                    href={`tel:${booking.client_phone}`}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    {booking.client_phone}
                  </a>
                ) : (
                  '-'
                )}
              </DetailRow>

              {(details.length > 0 || extra) && (
                <DetailRow icon={<MessageSquare size={16} />} label="Details">
                  <div className="flex flex-col gap-2">
                    {details.length > 0 && (
                      <ul className="flex flex-col gap-1">
                        {details.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                    {extra && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                          Bijzonderheden
                        </div>
                        <p className="mt-0.5 whitespace-pre-line">{extra}</p>
                      </div>
                    )}
                  </div>
                </DetailRow>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                  Status
                </span>
                <ArtistStatusBadge status={booking.status} />
              </div>

              {declineReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <span className="font-semibold">Reden afwijzing: </span>
                  {declineReason}
                </div>
              )}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-sm text-[var(--color-fg)]">{children}</dd>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-strong)] bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-5xl leading-none text-[var(--color-fg)]">
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--color-fg-muted)]">{sub}</div>
    </div>
  )
}

function ArtistEmpty({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
      <FileText size={42} className="text-[var(--color-fg-muted)]" />
      <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-[var(--color-fg)]">
        Nog geen aanvragen
      </h3>
      <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
        Klik op &ldquo;Nieuwe aanvraag&rdquo; om je eerste show in te dienen.
      </p>
      <Button size="lg" onClick={onOpen}>
        <CalendarPlus size={16} /> Nieuwe aanvraag
      </Button>
    </div>
  )
}
