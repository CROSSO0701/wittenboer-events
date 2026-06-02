'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Wrench, Palmtree, Check, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { StatusBadge } from '../../_components/StatusBadge'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import { BookingDetailSheet } from './BookingDetailSheet'
import { KlusDialog, type KlusRow } from './KlusDialog'
import { CrewAvailabilityDialog, type AvailabilityRow } from './CrewAvailabilityDialog'
import { cn } from '../../../../lib/utils/cn'
import { sourceLabel } from '../../../../lib/format'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}
type Klus = KlusRow & { assignments?: { staff_id: string }[] | null }
type Availability = AvailabilityRow & { staff?: { full_name: string | null } | null }

type DayGroup = {
  bookings: Booking[]
  klussen: Klus[]
  availability: Availability[]
}

// Bron-filter: label per waarde (uit de hoofdbalk gehaald, nu in een dropdown).
const SOURCE_OPTIONS = [
  ['all', 'Alle bronnen'],
  ['own', 'Eigen'],
  ['artwinlive', 'Artwin'],
] as const

// "Tonen"-toggles: elk een eigen kleurtint + lucide-icoon, zichtbaar pill-vormig
// (anders dan de aaneengesloten segmented control van "Wanneer").
const SHOW_TOGGLES = [
  { key: 'bookings', label: 'Boekingen', Icon: CalendarDays, tone: 'primary' },
  { key: 'klussen', label: 'Klussen', Icon: Wrench, tone: 'secondary' },
  { key: 'vrij', label: 'Vrij/vakantie', Icon: Palmtree, tone: 'tertiary' },
] as const

// Actieve-kleuren per tint (OKLCH-tokens). Inactief is overal hetzelfde grijs.
const SHOW_TONE_ACTIVE: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]',
  secondary:
    'border-[var(--color-secondary)] bg-[var(--color-secondary-soft)] text-[var(--color-secondary-darker)]',
  tertiary:
    'border-[var(--color-tertiary-deep)] bg-[var(--color-tertiary-soft)] text-[var(--color-secondary-darker)]',
}

function fmtTime(iso?: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}
function fmtDateHeader(iso: string) {
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso))
}
function isToday(iso: string) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return d.getTime() === t.getTime()
}
function ymd(d: Date) {
  // Lokale datum-componenten — NIET toISOString() (dat is UTC en schuift in
  // tijdzones oost van UTC, bv. Amsterdam, de dag een terug).
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
// Expandeer een datumbereik naar losse YYYY-MM-DD dagen binnen [from, to].
function eachDateInRange(start: string, end: string, from: string, to: string): string[] {
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

export function AgendaBoard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [klussen, setKlussen] = useState<Klus[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'upcoming' | 'all'>('upcoming')
  const [source, setSource] = useState<'all' | 'own' | 'artwinlive'>('all')
  const [show, setShow] = useState<{ bookings: boolean; klussen: boolean; vrij: boolean }>({
    bookings: true,
    klussen: true,
    vrij: true,
  })
  const [selected, setSelected] = useState<Booking | null>(null)
  const [editKlus, setEditKlus] = useState<Klus | null>(null)
  const [newKlus, setNewKlus] = useState(false)
  const [editAvailability, setEditAvailability] = useState<Availability | null>(null)
  const [newAvailability, setNewAvailability] = useState(false)

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const since = new Date()
      since.setDate(since.getDate() - 31)
      const sinceStr = since.toISOString().slice(0, 10)

      const [bookingsRes, klussenRes, availRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, artist:artists(stage_name)')
          .not('event_date', 'is', null)
          .gte('event_date', sinceStr)
          .order('event_date', { ascending: true })
          .order('event_start', { ascending: true, nullsFirst: true }),
        supabase
          .from('klussen')
          .select('*, assignments:klus_assignments(staff_id)')
          .gte('event_date', sinceStr)
          .order('event_date', { ascending: true })
          .order('event_start', { ascending: true, nullsFirst: true }),
        supabase
          .from('crew_availability')
          .select('*, staff:profiles(full_name)')
          .gte('end_date', sinceStr)
          .order('start_date', { ascending: true }),
      ])

      if (bookingsRes.error) throw bookingsRes.error
      setBookings((bookingsRes.data as Booking[]) ?? [])
      setKlussen((klussenRes.data as Klus[]) ?? [])
      setAvailability((availRes.data as Availability[]) ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { groups, total } = useMemo(() => {
    if (!bookings) return { groups: null as [string, DayGroup][] | null, total: 0 }
    const t0 = new Date()
    t0.setHours(0, 0, 0, 0)
    const fromStr = scope === 'upcoming' ? ymd(t0) : ymd(new Date(t0.getTime() - 365 * 24 * 3600 * 1000))
    const horizon = new Date(t0)
    horizon.setDate(horizon.getDate() + 365)
    const toStr = ymd(horizon)

    const map = new Map<string, DayGroup>()
    const ensure = (key: string) => {
      let g = map.get(key)
      if (!g) {
        g = { bookings: [], klussen: [], availability: [] }
        map.set(key, g)
      }
      return g
    }

    if (show.bookings) {
      for (const b of bookings) {
        if (source === 'own' && b.source === 'artwinlive') continue
        if (source === 'artwinlive' && b.source !== 'artwinlive') continue
        const isDead = b.status === 'cancelled' || b.status === 'declined'
        if (scope === 'upcoming') {
          if (isDead) continue
          if (!b.event_date || b.event_date < fromStr) continue
        }
        ensure(b.event_date ?? '-').bookings.push(b)
      }
    }

    if (show.klussen) {
      for (const k of klussen) {
        if (scope === 'upcoming' && k.event_date < fromStr) continue
        ensure(k.event_date).klussen.push(k)
      }
    }

    if (show.vrij) {
      for (const a of availability) {
        for (const day of eachDateInRange(a.start_date, a.end_date, fromStr, toStr)) {
          ensure(day).availability.push(a)
        }
      }
    }

    const entries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === '-') return 1
      if (b[0] === '-') return -1
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
    })
    const count = entries.reduce(
      (n, [, g]) => n + g.bookings.length + g.klussen.length + g.availability.length,
      0
    )
    return { groups: entries, total: count }
  }, [bookings, klussen, availability, scope, source, show])

  function toggleShow(key: keyof typeof show) {
    setShow((s) => ({ ...s, [key]: !s[key] }))
  }

  const sourceLabelCurrent = SOURCE_OPTIONS.find(([s]) => s === source)?.[1] ?? 'Alle bronnen'

  // De volledige filterset — één keer gedefinieerd, twee keer gerenderd
  // (inline op desktop, ingeklapt in <details> op mobiel).
  const filterControls = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* Wanneer — segmented control (kies-er-één, aaneengesloten) */}
      <div
        role="group"
        aria-label="Periode"
        className="inline-flex overflow-hidden rounded-full border border-[var(--color-border-strong)]"
      >
        {(['upcoming', 'all'] as const).map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            aria-pressed={scope === s}
            className={cn(
              'px-3 py-1 text-xs transition-colors',
              i > 0 && 'border-l border-[var(--color-border-strong)]',
              scope === s
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-white text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]'
            )}
          >
            {s === 'upcoming' ? 'Aankomend' : 'Ook verleden'}
          </button>
        ))}
      </div>

      {/* Tonen — gekleurde aan/uit-toggles met icoon + vinkje-prefix (multi-select) */}
      <div className="flex flex-wrap items-center gap-2">
        {SHOW_TOGGLES.map(({ key, label, Icon, tone }) => {
          const on = show[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleShow(key)}
              aria-pressed={on}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                on
                  ? SHOW_TONE_ACTIVE[tone]
                  : 'border-[var(--color-border)] bg-white text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
              )}
            >
              {on ? (
                <Check size={13} className="shrink-0" aria-hidden />
              ) : (
                <Icon size={13} className="shrink-0 opacity-60" aria-hidden />
              )}
              {label}
            </button>
          )
        })}
      </div>

      {/* Bron — uit de hoofdbalk gehaald, nu achter een ingetogen Filter-knop */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
              source === 'all'
                ? 'border-[var(--color-border)] bg-white text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
                : 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
            )}
          >
            <SlidersHorizontal size={13} className="shrink-0" aria-hidden />
            {sourceLabelCurrent}
            <ChevronDown size={13} className="shrink-0 opacity-60" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Bron</DropdownMenuLabel>
          {SOURCE_OPTIONS.map(([s, label]) => (
            <DropdownMenuItem key={s} onSelect={() => setSource(s)}>
              <Check size={14} className={cn('shrink-0', source === s ? 'opacity-100' : 'opacity-0')} aria-hidden />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Desktop: filters inline, item-telling rechts */}
      <div className="hidden items-start gap-4 md:flex">
        {filterControls}
        <span className="ml-auto shrink-0 pt-1 text-xs text-[var(--color-fg-muted)]">
          {bookings == null ? 'Laden…' : `${total} item${total === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Mobiel: alles ingeklapt achter één Filters-knop (default dicht) */}
      <details className="group md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-fg)] [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal size={14} className="shrink-0" aria-hidden />
          Filters
          <ChevronDown
            size={14}
            className="shrink-0 opacity-60 transition-transform group-open:rotate-180"
            aria-hidden
          />
          <span className="ml-auto text-[var(--color-fg-muted)]">
            {bookings == null ? 'Laden…' : `${total} item${total === 1 ? '' : 's'}`}
          </span>
        </summary>
        <div className="mt-3">{filterControls}</div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setNewKlus(true)}>
          <Wrench size={15} /> Klus toevoegen
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNewAvailability(true)}>
          <Palmtree size={15} /> Vrij/vakantie
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {bookings == null && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-[var(--color-border)] bg-white" />
          ))}
        </div>
      )}

      {groups && groups.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
          <CalendarDays size={40} className="text-[var(--color-fg-muted)]" />
          <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
            Niets gepland
          </h3>
          <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
            Boekingen, klussen en vrij/vakantie verschijnen hier, op datum gesorteerd.
          </p>
        </div>
      )}

      {groups?.map(([date, group]) => (
        <section key={date}>
          <h3
            className={cn(
              'mb-2 flex items-center gap-2 text-sm font-semibold capitalize',
              date !== '-' && isToday(date) ? 'text-[var(--color-primary)]' : 'text-[var(--color-fg)]'
            )}
          >
            {date === '-' ? 'Zonder datum' : fmtDateHeader(date)}
            {date !== '-' && isToday(date) && (
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-primary-deep)]">
                Vandaag
              </span>
            )}
          </h3>

          {group.availability.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {group.availability.map((a) => (
                <button
                  key={`${a.id}-${date}`}
                  type="button"
                  onClick={() => setEditAvailability(a)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-tertiary)] bg-[var(--color-tertiary-soft)] px-3 py-1 text-xs text-[var(--color-secondary-darker)] transition-colors hover:border-[var(--color-border-strong)]"
                >
                  <span aria-hidden>🌴</span>
                  <span className="font-medium">{a.staff?.full_name ?? 'Crewlid'}</span>
                  <span>· {a.kind === 'vakantie' ? 'vakantie' : 'vrij'}</span>
                </button>
              ))}
            </div>
          )}

          {(group.bookings.length > 0 || group.klussen.length > 0) && (
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
              {group.bookings.map((b) => (
                <button
                  key={`b-${b.id}`}
                  type="button"
                  onClick={() => setSelected(b)}
                  className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-1)]"
                >
                  <span className="w-12 shrink-0 font-medium tabular-nums text-[var(--color-fg)]">
                    {fmtTime(b.event_start) ?? '-'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--color-fg)]">
                      {b.artist?.stage_name ?? b.client_name ?? 'Boeking'}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-fg-muted)]">
                      {[b.event_location, sourceLabel(b.source)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <StatusBadge status={b.status} />
                </button>
              ))}

              {group.klussen.map((k) => (
                <button
                  key={`k-${k.id}`}
                  type="button"
                  onClick={() => setEditKlus(k)}
                  className="flex w-full items-center gap-3 border-b border-[var(--color-border)] border-l-2 border-l-[var(--color-secondary)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-surface-1)]"
                >
                  <span className="w-12 shrink-0 font-medium tabular-nums text-[var(--color-fg)]">
                    {fmtTime(k.event_start) ?? '-'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate font-medium text-[var(--color-fg)]">
                      <Wrench size={14} className="shrink-0 text-[var(--color-secondary)]" aria-hidden />
                      {k.title}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-fg-muted)]">
                      {[k.location, k.assignments && k.assignments.length > 0 ? `${k.assignments.length} crew` : null]
                        .filter(Boolean)
                        .join(' · ') || 'Klus'}
                    </span>
                  </span>
                  <Badge tone="neutral">{k.kind || 'Klus'}</Badge>
                </button>
              ))}
            </div>
          )}
        </section>
      ))}

      <BookingDetailSheet
        booking={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={() => {
          setSelected(null)
          load()
        }}
      />

      <KlusDialog
        open={newKlus}
        onOpenChange={setNewKlus}
        onSaved={() => {
          setNewKlus(false)
          load()
        }}
      />
      <KlusDialog
        klus={editKlus}
        open={!!editKlus}
        onOpenChange={(o) => !o && setEditKlus(null)}
        onSaved={() => {
          setEditKlus(null)
          load()
        }}
      />

      <CrewAvailabilityDialog
        open={newAvailability}
        onOpenChange={setNewAvailability}
        onSaved={() => {
          setNewAvailability(false)
          load()
        }}
      />
      <CrewAvailabilityDialog
        availability={editAvailability}
        open={!!editAvailability}
        onOpenChange={(o) => !o && setEditAvailability(null)}
        onSaved={() => {
          setEditAvailability(null)
          load()
        }}
      />
    </div>
  )
}
