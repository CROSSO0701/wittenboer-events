'use client'

import { useMemo, useState } from 'react'
import { Inbox, ArrowUpRight, Search } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { BookingDetailSheet } from './BookingDetailSheet'
import type { Database } from '../../../../lib/db/types.generated'
import { cn } from '../../../../lib/utils/cn'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}

type Filter = 'all' | 'today' | 'this-week' | 'upcoming' | 'artist' | 'client' | 'artwinlive'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alles' },
  { id: 'today', label: 'Vandaag' },
  { id: 'this-week', label: 'Deze week' },
  { id: 'upcoming', label: 'Later' },
  { id: 'artist', label: 'Van artiesten' },
  { id: 'client', label: 'Van klanten' },
  { id: 'artwinlive', label: 'ArtwinLive' },
]

function formatEUR(cents?: number | null) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const SOURCE_LABEL: Record<string, string> = {
  artist: 'Artiest',
  client: 'Klant via website',
  artwinlive: 'ArtwinLive',
}

export function InboxBoard({
  bookings,
  error,
  relativeDate,
  onChanged,
}: {
  bookings: Booking[] | null
  error: string | null
  relativeDate: (iso?: string | null) => string
  onChanged: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)

  const rows = useMemo(() => {
    if (!bookings) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const wkStart = new Date(today)
    wkStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const wkEnd = new Date(wkStart)
    wkEnd.setDate(wkStart.getDate() + 7)
    const t0 = today.getTime()
    return bookings.filter((b) => {
      // Source filter
      if (filter === 'artist' && b.source !== 'artist') return false
      if (filter === 'client' && b.source !== 'client') return false
      if (filter === 'artwinlive' && b.source !== 'artwinlive') return false
      // Date filter
      if (filter === 'today') {
        if (!b.event_date) return false
        return new Date(b.event_date).getTime() === t0
      }
      if (filter === 'this-week') {
        if (!b.event_date) return false
        const d = new Date(b.event_date).getTime()
        return d >= wkStart.getTime() && d < wkEnd.getTime()
      }
      if (filter === 'upcoming') {
        if (!b.event_date) return false
        return new Date(b.event_date).getTime() >= t0
      }
      // Search
      if (query) {
        const q = query.toLowerCase()
        const haystack = [
          b.client_name,
          b.event_location,
          b.artist?.stage_name,
          b.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [bookings, filter, query])

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
    )
  }

  if (bookings == null) {
    // Skeleton
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
          >
            <div className="h-4 w-16 rounded bg-[var(--color-surface-1)]" />
            <div className="h-4 w-20 rounded bg-[var(--color-surface-1)]" />
            <div className="h-4 w-32 rounded bg-[var(--color-surface-1)]" />
            <div className="ml-auto h-4 w-16 rounded bg-[var(--color-surface-1)]" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                filter === f.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                  : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]"
          />
          <Input
            placeholder="Zoeken..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-48 pl-8"
          />
        </div>
      </div>

      {rows && rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--color-surface-1)]">
              <tr className="border-b border-[var(--color-border)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2">Datum</th>
                <th className="px-4 py-2">Aangevraagd door</th>
                <th className="px-4 py-2">Klant / show</th>
                <th className="px-4 py-2">Artiest</th>
                <th className="px-4 py-2">Locatie</th>
                <th className="px-4 py-2 text-right">Gage</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                >
                  <td className="px-4 py-3 text-[var(--color-fg)]">{relativeDate(b.event_date)}</td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{SOURCE_LABEL[b.source] ?? b.source}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg)]">{b.client_name ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                    {b.artist?.stage_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                    {b.event_location ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-fg-secondary)]">
                    {formatEUR(b.fee_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BookingDetailSheet
        booking={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={() => {
          setSelected(null)
          onChanged()
        }}
      />
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
      <Inbox size={42} className="text-[var(--color-fg-muted)]" />
      <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
        Geen openstaande aanvragen. Lekker.
      </h3>
      <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
        Nieuwe aanvragen van artiesten of vanuit het contactformulier verschijnen hier.
      </p>
      <Link
        href="/contact"
        target="_blank"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-fg)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        Bekijk publieke contactformulier <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
