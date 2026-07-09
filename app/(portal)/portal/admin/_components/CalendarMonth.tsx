'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import { cn } from '../../../../lib/utils/cn'
import {
  type Booking,
  type Klus,
  type Availability,
  eachDateInRange,
  fmtTime,
  isTodayStr,
  ymd,
} from './agendaShared'
import {
  type CrewColor,
  AVAILABILITY_COLOR,
  NEUTRAL_CREW_COLOR,
} from './crewColors'

type CalendarItem =
  | { type: 'booking'; date: string; sortKey: string; label: string; color: CrewColor; data: Booking }
  | { type: 'klus'; date: string; sortKey: string; label: string; color: CrewColor; data: Klus }
  | { type: 'availability'; date: string; sortKey: string; label: string; color: CrewColor; data: Availability }

const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

const monthTitleFmt = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' })

// Maandag als eerste dag van de week (NL). JS getDay(): zo=0..za=6.
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

// Eerste kleur van de eerste toegewezen crew; anders neutraal.
function crewColorFor(
  staffIds: string[] | null | undefined,
  crewColors: Map<string, CrewColor>
): CrewColor {
  if (staffIds && staffIds.length > 0) {
    const first = crewColors.get(staffIds[0]!)
    if (first) return first
  }
  return NEUTRAL_CREW_COLOR
}

export function CalendarMonth({
  bookings,
  klussen,
  availability,
  crewColors,
  onSelectBooking,
  onSelectKlus,
  onSelectAvailability,
  onNewKlusOnDate,
  onOpenDay,
}: {
  bookings: Booking[]
  klussen: Klus[]
  availability: Availability[]
  crewColors: Map<string, CrewColor>
  onSelectBooking: (b: Booking) => void
  onSelectKlus: (k: Klus) => void
  onSelectAvailability: (a: Availability) => void
  onNewKlusOnDate: (dateStr: string) => void
  onOpenDay: (dateStr: string) => void
}) {
  // Anker = eerste van de zichtbare maand (lokaal).
  const [anchor, setAnchor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })

  const monthTitle = monthTitleFmt.format(anchor)

  // Bouw het rooster: 6 weken vanaf de maandag vóór of op de 1e.
  const { weeks, rangeFrom, rangeTo, monthIndex } = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - mondayIndex(first))
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      days.push(d)
    }
    const rows: Date[][] = []
    for (let w = 0; w < 6; w++) rows.push(days.slice(w * 7, w * 7 + 7))
    return {
      weeks: rows,
      rangeFrom: ymd(days[0]!),
      rangeTo: ymd(days[days.length - 1]!),
      monthIndex: anchor.getMonth(),
    }
  }, [anchor])

  // Bucket alle items per YYYY-MM-DD binnen het zichtbare venster.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    const push = (date: string, item: CalendarItem) => {
      let arr = map.get(date)
      if (!arr) {
        arr = []
        map.set(date, arr)
      }
      arr.push(item)
    }

    for (const b of bookings) {
      if (!b.event_date) continue
      if (b.event_date < rangeFrom || b.event_date > rangeTo) continue
      const time = fmtTime(b.event_start)
      const title = b.artist?.stage_name ?? b.client_name ?? 'Boeking'
      push(b.event_date, {
        type: 'booking',
        date: b.event_date,
        sortKey: (b.event_start ?? '0') + '-b',
        label: time ? `${time} ${title}` : title,
        color: crewColorFor(
          b.assignments?.map((a) => a.staff_id) ?? null,
          crewColors
        ),
        data: b,
      })
    }

    for (const k of klussen) {
      if (k.event_date < rangeFrom || k.event_date > rangeTo) continue
      const time = fmtTime(k.event_start)
      push(k.event_date, {
        type: 'klus',
        date: k.event_date,
        sortKey: (k.event_start ?? '0') + '-k',
        label: time ? `${time} ${k.title}` : k.title,
        color: crewColorFor(
          k.assignments?.map((a) => a.staff_id) ?? null,
          crewColors
        ),
        data: k,
      })
    }

    for (const a of availability) {
      for (const day of eachDateInRange(a.start_date, a.end_date, rangeFrom, rangeTo)) {
        push(day, {
          type: 'availability',
          date: day,
          sortKey: '0-av',
          label: `${a.staff?.full_name ?? 'Crew'} · ${a.kind === 'vakantie' ? 'vakantie' : 'vrij'}`,
          color: AVAILABILITY_COLOR,
          data: a,
        })
      }
    }

    for (const arr of map.values()) {
      arr.sort((x, y) => (x.sortKey < y.sortKey ? -1 : x.sortKey > y.sortKey ? 1 : 0))
    }
    return map
  }, [bookings, klussen, availability, crewColors, rangeFrom, rangeTo])

  function goToday() {
    const t = new Date()
    setAnchor(new Date(t.getFullYear(), t.getMonth(), 1))
  }
  function goPrev() {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))
  }
  function goNext() {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))
  }

  function onItemClick(item: CalendarItem) {
    if (item.type === 'booking') onSelectBooking(item.data)
    else if (item.type === 'klus') onSelectKlus(item.data)
    else onSelectAvailability(item.data)
  }

  return (
    <div>
      {/* Maandnavigatie */}
      <div className="mb-3 flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-border-strong)]">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Vorige maand"
            className="px-2 py-1 text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="border-x border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
          >
            Vandaag
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Volgende maand"
            className="px-2 py-1 text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <h3 className="text-sm font-semibold capitalize text-[var(--color-fg)]">{monthTitle}</h3>
      </div>

      {/* Grid — op smalle schermen horizontaal scrollen zodat cellen bruikbaar blijven */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          {/* Weekdag-kop */}
          <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-1)]">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weken */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const dateStr = ymd(day)
                const inMonth = day.getMonth() === monthIndex
                const today = isTodayStr(dateStr)
                const items = byDay.get(dateStr) ?? []
                const visible = items.slice(0, 3)
                const overflow = items.length - visible.length
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'group relative min-h-[104px] border-b border-r border-[var(--color-border)] p-1 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                      inMonth ? 'bg-white' : 'bg-[var(--color-surface-1)]/50'
                    )}
                  >
                    {/* Klik op lege ruimte in de cel -> nieuwe klus op deze datum */}
                    <button
                      type="button"
                      onClick={() => onNewKlusOnDate(dateStr)}
                      aria-label={`Nieuwe klus op ${dateStr}`}
                      className="absolute inset-0 z-0 cursor-pointer"
                      tabIndex={-1}
                    />
                    <div className="relative z-10 flex items-center justify-between px-1 pt-0.5">
                      <span
                        className={cn(
                          'inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs tabular-nums',
                          today
                            ? 'bg-[var(--color-primary)] font-semibold text-white'
                            : inMonth
                              ? 'text-[var(--color-fg)]'
                              : 'text-[var(--color-fg-muted)]'
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="relative z-10 mt-1 flex flex-col gap-0.5">
                      {visible.map((item, ii) => {
                        const multi =
                          (item.type === 'booking' || item.type === 'klus') &&
                          (item.data.assignments?.length ?? 0) > 1
                        return (
                          <button
                            key={`${item.type}-${item.data.id}-${ii}`}
                            type="button"
                            onClick={() => onItemClick(item)}
                            title={item.label}
                            className="flex w-full items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: item.color.bg,
                              borderColor: item.color.border,
                              color: item.color.text,
                            }}
                          >
                            {item.type === 'klus' && (
                              <Wrench size={10} className="shrink-0" aria-hidden />
                            )}
                            {item.type === 'availability' && (
                              <span aria-hidden className="shrink-0">
                                🌴
                              </span>
                            )}
                            <span className="truncate">{item.label}</span>
                            {multi && (
                              <span className="ml-auto shrink-0 opacity-70">
                                +{(item.data.assignments?.length ?? 1) - 1}
                              </span>
                            )}
                          </button>
                        )
                      })}
                      {overflow > 0 && (
                        <button
                          type="button"
                          onClick={() => onOpenDay(dateStr)}
                          className="rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
                        >
                          +{overflow} meer
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
