'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarPlus, FileText } from 'lucide-react'
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                  <th className="px-4 py-2">Datum show</th>
                  <th className="px-4 py-2">Locatie</th>
                  <th className="px-4 py-2">Wat heb je nodig</th>
                  <th className="px-4 py-2">Status</th>
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
                      className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
