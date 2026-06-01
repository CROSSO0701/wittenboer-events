'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Inbox, Music2, Search, User } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '../../../../components/ui/input'
import { cn } from '../../../../lib/utils/cn'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { relativeDate, fmtAgo, CONTACT_STATUS_LABEL, INQUIRY_STATUS_LABEL } from '../../../../lib/format'
import { BookingDetailSheet } from './BookingDetailSheet'
import { StatusSelect } from './StatusSelect'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}

type InquiryType = 'contact' | 'show-package' | 'artist-booking'

// Bron-icoon per rij: artiest (muziek), klant (persoon), losse aanvraag (lijst).
type IconKind = 'artist' | 'client' | 'request'

// Genormaliseerde rij voor het "Wacht op jou"-blok.
type FeedItem = {
  key: string
  iconKind: IconKind
  kind: 'booking' | 'inquiry'
  name: string
  email: string | null
  date: string | null
  location: string | null
  need: string
  createdAt: string
  status: string
  booking?: Booking
  inquiryType?: InquiryType
  statusOptions?: readonly string[]
}

const CONTACT_STATUSES = ['new', 'replied', 'closed'] as const
const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'closed'] as const

const ICON_LABEL: Record<IconKind, string> = {
  artist: 'Artiest',
  client: 'Klant',
  request: 'Losse aanvraag',
}

function RowIcon({ kind }: { kind: IconKind }) {
  const Icon = kind === 'artist' ? Music2 : kind === 'client' ? User : ClipboardList
  return (
    <Icon size={16} className="text-[var(--color-fg-muted)]" aria-label={ICON_LABEL[kind]} />
  )
}

const KIND_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Alles' },
  { id: 'booking', label: 'Boekingen' },
  { id: 'contact', label: 'Contact' },
  { id: 'show-package', label: 'Pakketten' },
  { id: 'artist-booking', label: 'Artiest-aanvragen' },
]

/**
 * "Wacht op jou" — de unified to-do-lijst: openstaande boekingen (pending)
 * plus nieuwe losse aanvragen (contact / show-pakket / artiest), met
 * type-filterpills en zoek. Herbruikbaar; wordt zowel op het admin-dashboard
 * als (historisch) in het aanvragen-overzicht gebruikt.
 *
 * `onCount` rapporteert het aantal open items terug naar de parent (voor bv.
 * een klikbare stat-kaart). `anchorId` zet een scroll-anchor op de sectie.
 */
export function WachtOpJou({
  anchorId,
  onCount,
}: {
  anchorId?: string
  onCount?: (n: number) => void
}) {
  const [feed, setFeed] = useState<FeedItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const [b, c, d, a] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, artist:artists(stage_name)')
          .eq('status', 'pending')
          .order('event_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('contact_inquiries')
          .select('*')
          .eq('status', 'new')
          .order('created_at', { ascending: false }),
        supabase
          .from('disco_inquiries')
          .select('*, package:disco_packages(name)')
          .eq('status', 'new')
          .order('created_at', { ascending: false }),
        supabase
          .from('artist_booking_inquiries')
          .select('*, artist:artists(stage_name)')
          .eq('status', 'new')
          .order('created_at', { ascending: false }),
      ])
      if (b.error || c.error || d.error || a.error) {
        throw new Error(
          b.error?.message ?? c.error?.message ?? d.error?.message ?? a.error?.message ?? 'Fout'
        )
      }

      const items: FeedItem[] = []

      for (const row of (b.data as Booking[]) ?? []) {
        items.push({
          key: `booking:${row.id}`,
          iconKind: row.source === 'artist' ? 'artist' : 'client',
          kind: 'booking',
          name: row.client_name ?? '(geen klantnaam)',
          email: row.client_email,
          date: row.event_date,
          location: row.event_location,
          need: row.artist?.stage_name ? `Artiest · ${row.artist.stage_name}` : 'Boeking',
          createdAt: row.created_at,
          status: row.status,
          booking: row,
        })
      }

      type ContactRow = Database['public']['Tables']['contact_inquiries']['Row']
      for (const row of (c.data as ContactRow[]) ?? []) {
        items.push({
          key: `contact:${row.id}`,
          iconKind: 'request',
          kind: 'inquiry',
          name: row.name,
          email: row.email,
          date: null,
          location: null,
          need: row.subject ?? 'Contactvraag',
          createdAt: row.created_at,
          status: row.status,
          inquiryType: 'contact',
          statusOptions: CONTACT_STATUSES,
        })
      }

      type DiscoRow = Database['public']['Tables']['disco_inquiries']['Row'] & {
        package?: { name: string } | null
      }
      for (const row of (d.data as DiscoRow[]) ?? []) {
        items.push({
          key: `disco:${row.id}`,
          iconKind: 'request',
          kind: 'inquiry',
          name: row.name,
          email: row.email,
          date: row.event_date,
          location: row.location,
          need: row.package?.name ? `Pakket · ${row.package.name}` : 'Show-pakket',
          createdAt: row.created_at,
          status: row.status,
          inquiryType: 'show-package',
          statusOptions: INQUIRY_STATUSES,
        })
      }

      type ArtistRow = Database['public']['Tables']['artist_booking_inquiries']['Row'] & {
        artist?: { stage_name: string } | null
      }
      for (const row of (a.data as ArtistRow[]) ?? []) {
        items.push({
          key: `artist-inquiry:${row.id}`,
          iconKind: 'artist',
          kind: 'inquiry',
          name: row.name,
          email: row.email,
          date: row.event_date,
          location: row.event_location,
          need: row.artist?.stage_name ? `Artiest · ${row.artist.stage_name}` : 'Artiest-aanvraag',
          createdAt: row.created_at,
          status: row.status,
          inquiryType: 'artist-booking',
          statusOptions: INQUIRY_STATUSES,
        })
      }

      items.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
      setFeed(items)
      onCount?.(items.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [onCount])

  useEffect(() => {
    load()
  }, [load])

  async function updateInquiryStatus(type: InquiryType, id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/inquiries/${type}/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Status bijgewerkt')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bijwerken faalde')
    }
  }

  const rows = useMemo(() => {
    if (!feed) return null
    return feed.filter((item) => {
      if (filter === 'booking' && item.kind !== 'booking') return false
      if (filter === 'contact' && item.inquiryType !== 'contact') return false
      if (filter === 'show-package' && item.inquiryType !== 'show-package') return false
      if (filter === 'artist-booking' && item.inquiryType !== 'artist-booking') return false
      if (query) {
        const q = query.toLowerCase()
        const haystack = [item.name, item.email, item.location, item.need]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [feed, filter, query])

  return (
    <section id={anchorId} className="scroll-mt-24">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
          Wacht op jou
        </h2>
        <span className="text-xs text-[var(--color-fg-muted)]">
          {feed == null ? 'Laden…' : `${feed.length} open`}
        </span>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {KIND_FILTERS.map((f) => (
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

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : feed == null ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
            >
              <div className="h-4 w-6 rounded bg-[var(--color-surface-1)]" />
              <div className="h-4 w-32 rounded bg-[var(--color-surface-1)]" />
              <div className="h-4 w-20 rounded bg-[var(--color-surface-1)]" />
              <div className="ml-auto h-4 w-16 rounded bg-[var(--color-surface-1)]" />
            </div>
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 bg-[var(--color-surface-1)]">
              <tr className="border-b border-[var(--color-border)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2 w-8" aria-label="Type" />
                <th className="px-4 py-2">Naam</th>
                <th className="px-4 py-2">Datum</th>
                <th className="px-4 py-2">Locatie</th>
                <th className="px-4 py-2">Wat nodig</th>
                <th className="px-4 py-2">Binnen</th>
                <th className="px-4 py-2 text-right">Actie</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((item) => (
                <tr
                  key={item.key}
                  className="border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <RowIcon kind={item.iconKind} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-fg)]">{item.name}</div>
                    {item.email && (
                      <div className="text-xs text-[var(--color-fg-muted)]">{item.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                    {item.date ? relativeDate(item.date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                    {item.location ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{item.need}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">{fmtAgo(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {item.booking ? (
                      <button
                        type="button"
                        onClick={() => setSelected(item.booking!)}
                        className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        Bekijken
                      </button>
                    ) : item.inquiryType && item.statusOptions ? (
                      <StatusSelect
                        value={item.status}
                        options={item.statusOptions}
                        labels={item.inquiryType === 'contact' ? CONTACT_STATUS_LABEL : INQUIRY_STATUS_LABEL}
                        onChange={(v) => updateInquiryStatus(item.inquiryType!, item.key.split(':')[1], v)}
                      />
                    ) : null}
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
          load()
        }}
      />
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
      <Inbox size={42} className="text-[var(--color-fg-muted)]" />
      <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
        Niets wacht op je.
      </h3>
      <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
        Nieuwe boekingen en aanvragen vanaf de site verschijnen hier zodra ze binnenkomen.
      </p>
    </div>
  )
}
