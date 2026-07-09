'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Wrench,
  Palmtree,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Search,
  List,
  Grid3x3,
  Columns3,
  Users,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import { StatusBadge } from '../../_components/StatusBadge'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import { BookingDetailSheet } from './BookingDetailSheet'
import { KlusDialog } from './KlusDialog'
import { CrewAvailabilityDialog } from './CrewAvailabilityDialog'
import { CalendarMonth } from './CalendarMonth'
import { CalendarWeek } from './CalendarWeek'
import { useStaffList } from './useStaffList'
import {
  buildCrewColorMap,
  AVAILABILITY_COLOR,
  NEUTRAL_CREW_COLOR,
  type CrewColor,
} from './crewColors'
import {
  type Booking,
  type Klus,
  type Availability,
  type DayGroup,
  fmtTime,
  fmtDateHeader,
  isTodayStr,
  ymd,
  eachDateInRange,
} from './agendaShared'
import { cn } from '../../../../lib/utils/cn'
import { sourceLabel } from '../../../../lib/format'

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

// Sentinels voor de crew-filter naast de echte crew-id's.
const NO_CREW = '__none__'
const VRIJ_KEY = '__vrij__'

type ViewMode = 'month' | 'week' | 'list'

const VIEW_OPTIONS: { key: ViewMode; label: string; Icon: typeof Grid3x3 }[] = [
  { key: 'month', label: 'Maand', Icon: Grid3x3 },
  { key: 'week', label: 'Week', Icon: Columns3 },
  { key: 'list', label: 'Lijst', Icon: List },
]

export function AgendaBoard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [klussen, setKlussen] = useState<Klus[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'upcoming' | 'all'>('upcoming')
  const [source, setSource] = useState<'all' | 'own' | 'artwinlive'>('all')
  const [view, setView] = useState<ViewMode>('month')
  const [show, setShow] = useState<{ bookings: boolean; klussen: boolean; vrij: boolean }>({
    bookings: true,
    klussen: true,
    vrij: true,
  })
  const [selected, setSelected] = useState<Booking | null>(null)
  const [editKlus, setEditKlus] = useState<Klus | null>(null)
  const [newKlus, setNewKlus] = useState(false)
  const [newKlusDate, setNewKlusDate] = useState<string | null>(null)
  const [editAvailability, setEditAvailability] = useState<Availability | null>(null)
  const [newAvailability, setNewAvailability] = useState(false)

  // Crew-lijst voor de kleuren + per-crew filter. Alfabetisch (full_name asc),
  // wat de stabiele kleurtoewijzing voedt.
  const { staff } = useStaffList()
  const crewColors = useMemo(() => buildCrewColorMap(staff), [staff])

  // Aangevinkte crew-filter. null = nog niet geïnitialiseerd; bij eerste crew-load
  // vullen we alles aan (default = alles zichtbaar), inclusief de twee sentinels.
  const [crewFilter, setCrewFilter] = useState<Set<string> | null>(null)
  useEffect(() => {
    if (staff.length === 0) return
    setCrewFilter((prev) => {
      if (prev) return prev
      const next = new Set<string>(staff.map((s) => s.id))
      next.add(NO_CREW)
      next.add(VRIJ_KEY)
      return next
    })
  }, [staff])

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const since = new Date()
      since.setDate(since.getDate() - 31)
      const sinceStr = since.toISOString().slice(0, 10)

      const [bookingsRes, klussenRes, availRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, artist:artists(stage_name), assignments:booking_assignments(staff_id)')
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

  // Hulp: matcht een item met crew-toewijzingen tegen de crew-filter.
  // - geen filter actief (null of alle aangevinkt) -> alles door.
  // - anders: item met crew door als minstens één toegewezen crewlid aanstaat;
  //   item zonder crew door als de "Zonder crew"-sentinel aanstaat.
  const crewAllOn = useMemo(() => {
    if (!crewFilter) return true
    // Alle crew + beide sentinels aan = geen filter.
    return staff.every((s) => crewFilter.has(s.id)) && crewFilter.has(NO_CREW) && crewFilter.has(VRIJ_KEY)
  }, [crewFilter, staff])

  const passesCrew = useCallback(
    (staffIds: string[]) => {
      if (crewAllOn || !crewFilter) return true
      if (staffIds.length === 0) return crewFilter.has(NO_CREW)
      return staffIds.some((id) => crewFilter.has(id))
    },
    [crewAllOn, crewFilter]
  )

  // Gefilterde losse arrays — gedeeld door alle views (maand/week/lijst).
  // De datum-scope (upcoming) blijft alleen op de LIJST van toepassing; de
  // kalender navigeert vrij door maanden/weken, dus die krijgt de volledige set
  // (wel de bron/zoek/crew-filters, en de tonen-toggles).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (...fields: (string | null | undefined)[]) =>
      q === '' || fields.some((f) => f != null && f.toLowerCase().includes(q))

    const outBookings: Booking[] = []
    const outKlussen: Klus[] = []
    const outAvailability: Availability[] = []

    if (show.bookings && bookings) {
      for (const b of bookings) {
        if (source === 'own' && b.source === 'artwinlive') continue
        if (source === 'artwinlive' && b.source !== 'artwinlive') continue
        const isDead = b.status === 'cancelled' || b.status === 'declined'
        if (isDead) continue
        if (!matches(b.client_name, b.client_email, b.event_location, b.notes, b.artist?.stage_name))
          continue
        if (!passesCrew(b.assignments?.map((a) => a.staff_id) ?? [])) continue
        outBookings.push(b)
      }
    }

    if (show.klussen) {
      for (const k of klussen) {
        if (!matches(k.title, k.location, k.notes, k.kind)) continue
        if (!passesCrew(k.assignments?.map((a) => a.staff_id) ?? [])) continue
        outKlussen.push(k)
      }
    }

    // Vrij/vakantie: niet doorzoekbaar, dus verberg bij actieve zoekopdracht.
    if (show.vrij && q === '') {
      for (const a of availability) {
        if (!crewAllOn && crewFilter) {
          // "Vrij/vakantie"-sentinel bepaalt of de categorie zichtbaar is; daarnaast
          // moet het betrokken crewlid aanstaan (of onbekend crew is altijd via VRIJ).
          if (!crewFilter.has(VRIJ_KEY)) continue
          if (a.staff_id && !crewFilter.has(a.staff_id)) continue
        }
        outAvailability.push(a)
      }
    }

    return { bookings: outBookings, klussen: outKlussen, availability: outAvailability }
  }, [
    bookings,
    klussen,
    availability,
    show,
    source,
    query,
    passesCrew,
    crewAllOn,
    crewFilter,
  ])

  // Dag-groepen voor de LIJST-view (met scope-afkap voor 'upcoming').
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

    for (const b of filtered.bookings) {
      if (scope === 'upcoming' && (!b.event_date || b.event_date < fromStr)) continue
      ensure(b.event_date ?? '-').bookings.push(b)
    }
    for (const k of filtered.klussen) {
      if (scope === 'upcoming' && k.event_date < fromStr) continue
      ensure(k.event_date).klussen.push(k)
    }
    for (const a of filtered.availability) {
      for (const day of eachDateInRange(a.start_date, a.end_date, fromStr, toStr)) {
        ensure(day).availability.push(a)
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
  }, [bookings, filtered, scope])

  function toggleShow(key: keyof typeof show) {
    setShow((s) => ({ ...s, [key]: !s[key] }))
  }

  function toggleCrew(id: string) {
    setCrewFilter((prev) => {
      const base =
        prev ?? new Set<string>([...staff.map((s) => s.id), NO_CREW, VRIJ_KEY])
      const next = new Set(base)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function setAllCrew(on: boolean) {
    if (!on) {
      setCrewFilter(new Set())
    } else {
      setCrewFilter(new Set<string>([...staff.map((s) => s.id), NO_CREW, VRIJ_KEY]))
    }
  }

  const sourceLabelCurrent = SOURCE_OPTIONS.find(([s]) => s === source)?.[1] ?? 'Alle bronnen'

  // Klik in kalender op lege dagcel -> nieuwe klus met voorvul-datum.
  function handleNewKlusOnDate(dateStr: string) {
    setNewKlusDate(dateStr)
    setNewKlus(true)
  }
  // "+N meer" -> spring naar de lijst. Ligt de dag in het verleden, dan zetten we
  // de scope op 'all' zodat die dag ook echt zichtbaar is in de lijst.
  function handleOpenDay(dateStr: string) {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    if (dateStr < ymd(t)) setScope('all')
    setView('list')
  }

  const crewLegend = (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-fg)]">
          <Users size={13} aria-hidden /> Crew
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setAllCrew(true)}
            className="text-[var(--color-primary)] hover:underline"
          >
            Alles
          </button>
          <span className="text-[var(--color-border-strong)]">·</span>
          <button
            type="button"
            onClick={() => setAllCrew(false)}
            className="text-[var(--color-fg-muted)] hover:underline"
          >
            Geen
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-0.5">
        {staff.map((s) => {
          const on = crewFilter ? crewFilter.has(s.id) : true
          const color = crewColors.get(s.id) ?? NEUTRAL_CREW_COLOR
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggleCrew(s.id)}
                aria-pressed={on}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-[var(--color-surface-1)]',
                  on ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-muted)]'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border',
                    !on && 'opacity-40'
                  )}
                  style={{ backgroundColor: on ? color.dot : 'transparent', borderColor: color.dot }}
                >
                  {on && <Check size={10} className="text-white" aria-hidden />}
                </span>
                <span className="truncate">{s.full_name ?? 'Crewlid'}</span>
              </button>
            </li>
          )
        })}

        {/* Zonder crew */}
        <li>
          <CrewToggleRow
            label="Zonder crew"
            color={NEUTRAL_CREW_COLOR}
            on={crewFilter ? crewFilter.has(NO_CREW) : true}
            onClick={() => toggleCrew(NO_CREW)}
          />
        </li>
        {/* Vrij/vakantie */}
        <li>
          <CrewToggleRow
            label="Vrij/vakantie"
            color={AVAILABILITY_COLOR}
            on={crewFilter ? crewFilter.has(VRIJ_KEY) : true}
            onClick={() => toggleCrew(VRIJ_KEY)}
          />
        </li>
      </ul>
    </div>
  )

  // De volledige filterset — één keer gedefinieerd, twee keer gerenderd
  // (inline op desktop, ingeklapt in <details> op mobiel).
  const filterControls = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* Zoeken — filtert de reeds geladen data client-side (case-insensitive) */}
      <div className="relative w-full sm:w-64">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op klant, artiest, locatie of titel"
          aria-label="Zoeken in agenda"
          className="h-9 pl-9 text-xs"
        />
      </div>

      {/* Wanneer — segmented control (kies-er-één). Alleen relevant voor de lijst. */}
      {view === 'list' && (
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
      )}

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
      {/* View-switcher — segmented control in dezelfde stijl als "Aankomend/Ook verleden" */}
      <div className="flex items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Weergave"
          className="inline-flex overflow-hidden rounded-full border border-[var(--color-border-strong)]"
        >
          {VIEW_OPTIONS.map(({ key, label, Icon }, i) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 text-xs transition-colors',
                i > 0 && 'border-l border-[var(--color-border-strong)]',
                view === key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]'
              )}
            >
              <Icon size={13} className="shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-xs text-[var(--color-fg-muted)]">
          {bookings == null ? 'Laden…' : `${total} item${total === 1 ? '' : 's'} in lijst`}
        </span>
      </div>

      {/* Desktop: filters inline */}
      <div className="hidden items-start gap-4 md:flex">{filterControls}</div>

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
        </summary>
        <div className="mt-3">{filterControls}</div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            setNewKlusDate(null)
            setNewKlus(true)
          }}
        >
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

      {/* KALENDER-VIEWS: crew-legenda naast de kalender (op mobiel ingeklapt) */}
      {bookings != null && (view === 'month' || view === 'week') && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          {/* Legenda: desktop vast, mobiel in een <details> */}
          <div className="hidden lg:block">{crewLegend}</div>
          <details className="group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-fg)] [&::-webkit-details-marker]:hidden">
              <Users size={14} className="shrink-0" aria-hidden />
              Crew &amp; kleuren
              <ChevronDown
                size={14}
                className="shrink-0 opacity-60 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="mt-3">{crewLegend}</div>
          </details>

          <div className="min-w-0">
            {view === 'month' ? (
              <CalendarMonth
                bookings={filtered.bookings}
                klussen={filtered.klussen}
                availability={filtered.availability}
                crewColors={crewColors}
                onSelectBooking={setSelected}
                onSelectKlus={setEditKlus}
                onSelectAvailability={setEditAvailability}
                onNewKlusOnDate={handleNewKlusOnDate}
                onOpenDay={handleOpenDay}
              />
            ) : (
              <CalendarWeek
                bookings={filtered.bookings}
                klussen={filtered.klussen}
                availability={filtered.availability}
                crewColors={crewColors}
                onSelectBooking={setSelected}
                onSelectKlus={setEditKlus}
                onSelectAvailability={setEditAvailability}
              />
            )}
          </div>
        </div>
      )}

      {/* LIJST-VIEW — volledig behouden zoals voorheen */}
      {bookings != null && view === 'list' && (
        <>
          {groups && groups.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
              {query.trim() ? (
                <>
                  <Search size={40} className="text-[var(--color-fg-muted)]" />
                  <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
                    Geen resultaten
                  </h3>
                  <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
                    Geen resultaten voor deze zoekopdracht.
                  </p>
                </>
              ) : (
                <>
                  <CalendarDays size={40} className="text-[var(--color-fg-muted)]" />
                  <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
                    Niets gepland
                  </h3>
                  <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
                    Boekingen, klussen en vrij/vakantie verschijnen hier, op datum gesorteerd.
                  </p>
                </>
              )}
            </div>
          )}

          {groups?.map(([date, group]) => (
            <section key={date}>
              <h3
                className={cn(
                  'mb-2 flex items-center gap-2 text-sm font-semibold capitalize',
                  date !== '-' && isTodayStr(date) ? 'text-[var(--color-primary)]' : 'text-[var(--color-fg)]'
                )}
              >
                {date === '-' ? 'Zonder datum' : fmtDateHeader(date)}
                {date !== '-' && isTodayStr(date) && (
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
        </>
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

      {/* Nieuwe klus — key op de voorvul-datum zodat het uncontrolled datum-veld
          (defaultValue) opnieuw initialiseert wanneer je op een andere dagcel klikt. */}
      <KlusDialog
        key={`new-klus-${newKlusDate ?? 'none'}`}
        open={newKlus}
        onOpenChange={(o) => {
          setNewKlus(o)
          if (!o) setNewKlusDate(null)
        }}
        defaultDate={newKlusDate}
        onSaved={() => {
          setNewKlus(false)
          setNewKlusDate(null)
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

// Kleine hulp-rij voor de sentinels (Zonder crew / Vrij) in de legenda.
function CrewToggleRow({
  label,
  color,
  on,
  onClick,
}: {
  label: string
  color: CrewColor
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-[var(--color-surface-1)]',
        on ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-muted)]'
      )}
    >
      <span
        className={cn(
          'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border',
          !on && 'opacity-40'
        )}
        style={{ backgroundColor: on ? color.dot : 'transparent', borderColor: color.dot }}
      >
        {on && <Check size={10} className="text-white" aria-hidden />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
