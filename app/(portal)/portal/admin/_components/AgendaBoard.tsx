'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Wrench, Palmtree } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { StatusBadge } from '../../_components/StatusBadge'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { BookingDetailSheet } from './BookingDetailSheet'
import { KlusDialog, type KlusRow } from './KlusDialog'
import { CrewAvailabilityDialog, type AvailabilityRow } from './CrewAvailabilityDialog'
import { cn } from '../../../../lib/utils/cn'

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

const SOURCE_LABEL: Record<string, string> = {
  artist: 'Artiest',
  client: 'Klant',
  artwinlive: 'ArtwinLive',
}
const KLUS_KIND_LABEL: Record<string, string> = {
  opbouw: 'Opbouw',
  afbreken: 'Afbreken',
  ophalen: 'Ophalen',
  overig: 'Overig',
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
  return d.toISOString().slice(0, 10)
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
        ensure(b.event_date ?? '—').bookings.push(b)
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
      if (a[0] === '—') return 1
      if (b[0] === '—') return -1
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(['upcoming', 'all'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              scope === s
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
            )}
          >
            {s === 'upcoming' ? 'Aankomend' : 'Ook verleden'}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden />
        {([['all', 'Alle bronnen'], ['own', 'Eigen'], ['artwinlive', 'Artwin']] as const).map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              source === s
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden />
        {(
          [
            ['bookings', 'Boekingen'],
            ['klussen', 'Klussen'],
            ['vrij', 'Vrij/vakantie'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleShow(key)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              show[key]
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--color-fg-muted)]">
          {bookings == null ? 'Laden…' : `${total} item${total === 1 ? '' : 's'}`}
        </span>
      </div>

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
              date !== '—' && isToday(date) ? 'text-[var(--color-primary)]' : 'text-[var(--color-fg)]'
            )}
          >
            {date === '—' ? 'Zonder datum' : fmtDateHeader(date)}
            {date !== '—' && isToday(date) && (
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
                    {fmtTime(b.event_start) ?? '—'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--color-fg)]">
                      {b.artist?.stage_name ?? b.client_name ?? 'Boeking'}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-fg-muted)]">
                      {[b.event_location, SOURCE_LABEL[b.source] ?? b.source].filter(Boolean).join(' · ')}
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
                    {fmtTime(k.event_start) ?? '—'}
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
                  <Badge tone="neutral">{KLUS_KIND_LABEL[k.kind] ?? 'Klus'}</Badge>
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
