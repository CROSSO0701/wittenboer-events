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

const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const RANGE_FMT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' })

// Zichtbare uur-as. Buiten dit bereik (of zonder tijd) valt een item in de
// "hele dag"-strook bovenaan.
const DAY_START_HOUR = 7
const DAY_END_HOUR = 24
const HOUR_PX = 44

type TimedItem = {
  type: 'booking' | 'klus'
  id: string
  label: string
  color: CrewColor
  topPx: number
  heightPx: number
  onClick: () => void
}
type AllDayItem = {
  type: 'booking' | 'klus' | 'availability'
  id: string
  label: string
  color: CrewColor
  onClick: () => void
}

function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}
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

// Lokale minuten sinds middernacht uit een ISO-tijd (nl weergegeven via fmtTime,
// maar voor de positie hebben we de numerieke lokale tijd nodig).
function localMinutes(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function CalendarWeek({
  bookings,
  klussen,
  availability,
  crewColors,
  onSelectBooking,
  onSelectKlus,
  onSelectAvailability,
}: {
  bookings: Booking[]
  klussen: Klus[]
  availability: Availability[]
  crewColors: Map<string, CrewColor>
  onSelectBooking: (b: Booking) => void
  onSelectKlus: (k: Klus) => void
  onSelectAvailability: (a: Availability) => void
}) {
  const [anchor, setAnchor] = useState(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    const start = new Date(t)
    start.setDate(t.getDate() - mondayIndex(t))
    return start
  })

  const days = useMemo(() => {
    const out: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor)
      d.setDate(anchor.getDate() + i)
      out.push(d)
    }
    return out
  }, [anchor])

  const rangeFrom = ymd(days[0]!)
  const rangeTo = ymd(days[6]!)
  const rangeTitle = `${RANGE_FMT.format(days[0]!)} – ${RANGE_FMT.format(days[6]!)}`

  const { timedByDay, allDayByDay } = useMemo(() => {
    const timed = new Map<string, TimedItem[]>()
    const allDay = new Map<string, AllDayItem[]>()
    const pushTimed = (date: string, item: TimedItem) => {
      let arr = timed.get(date)
      if (!arr) {
        arr = []
        timed.set(date, arr)
      }
      arr.push(item)
    }
    const pushAllDay = (date: string, item: AllDayItem) => {
      let arr = allDay.get(date)
      if (!arr) {
        arr = []
        allDay.set(date, arr)
      }
      arr.push(item)
    }

    const placeTimed = (
      date: string,
      startIso: string | null,
      endIso: string | null,
      type: 'booking' | 'klus',
      id: string,
      label: string,
      color: CrewColor,
      onClick: () => void
    ) => {
      if (!startIso) {
        pushAllDay(date, { type, id, label, color, onClick })
        return
      }
      const startMin = localMinutes(startIso)
      if (startMin < DAY_START_HOUR * 60 || startMin >= DAY_END_HOUR * 60) {
        // Buiten de zichtbare uur-as: toon als hele-dag-blok bovenaan.
        pushAllDay(date, { type, id, label, color, onClick })
        return
      }
      let endMin = endIso ? localMinutes(endIso) : startMin + 60
      if (endMin <= startMin) endMin = startMin + 60
      endMin = Math.min(endMin, DAY_END_HOUR * 60)
      // px per minuut = HOUR_PX / 60. Positie t.o.v. de eerste zichtbare uur-lijn.
      const topPx = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_PX
      const heightPx = Math.max(((endMin - startMin) / 60) * HOUR_PX, 18)
      pushTimed(date, { type, id, label, color, topPx, heightPx, onClick })
    }

    for (const b of bookings) {
      if (!b.event_date || b.event_date < rangeFrom || b.event_date > rangeTo) continue
      const title = b.artist?.stage_name ?? b.client_name ?? 'Boeking'
      const time = fmtTime(b.event_start)
      placeTimed(
        b.event_date,
        b.event_start,
        b.event_end,
        'booking',
        b.id,
        time ? `${time} ${title}` : title,
        crewColorFor(b.assignments?.map((a) => a.staff_id) ?? null, crewColors),
        () => onSelectBooking(b)
      )
    }
    for (const k of klussen) {
      if (k.event_date < rangeFrom || k.event_date > rangeTo) continue
      const time = fmtTime(k.event_start)
      placeTimed(
        k.event_date,
        k.event_start,
        k.event_end,
        'klus',
        k.id,
        time ? `${time} ${k.title}` : k.title,
        crewColorFor(k.assignments?.map((a) => a.staff_id) ?? null, crewColors),
        () => onSelectKlus(k)
      )
    }
    for (const a of availability) {
      for (const day of eachDateInRange(a.start_date, a.end_date, rangeFrom, rangeTo)) {
        pushAllDay(day, {
          type: 'availability',
          id: `${a.id}-${day}`,
          label: `${a.staff?.full_name ?? 'Crew'} · ${a.kind === 'vakantie' ? 'vakantie' : 'vrij'}`,
          color: AVAILABILITY_COLOR,
          onClick: () => onSelectAvailability(a),
        })
      }
    }

    for (const arr of timed.values()) arr.sort((x, y) => x.topPx - y.topPx)
    return { timedByDay: timed, allDayByDay: allDay }
  }, [
    bookings,
    klussen,
    availability,
    crewColors,
    rangeFrom,
    rangeTo,
    onSelectBooking,
    onSelectKlus,
    onSelectAvailability,
  ])

  const hours: number[] = []
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h)
  const gridHeight = hours.length * HOUR_PX

  function goToday() {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    const start = new Date(t)
    start.setDate(t.getDate() - mondayIndex(t))
    setAnchor(start)
  }
  function goPrev() {
    setAnchor((a) => {
      const n = new Date(a)
      n.setDate(a.getDate() - 7)
      return n
    })
  }
  function goNext() {
    setAnchor((a) => {
      const n = new Date(a)
      n.setDate(a.getDate() + 7)
      return n
    })
  }

  return (
    <div>
      {/* Weeknavigatie */}
      <div className="mb-3 flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border border-[var(--color-border-strong)]">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Vorige week"
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
            aria-label="Volgende week"
            className="px-2 py-1 text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-fg)]">{rangeTitle}</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          {/* Dagkoppen */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[var(--color-border)] bg-[var(--color-surface-1)]">
            <div />
            {days.map((day, i) => {
              const today = isTodayStr(ymd(day))
              return (
                <div
                  key={ymd(day)}
                  className={cn(
                    'border-l border-[var(--color-border)] px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide',
                    today ? 'text-[var(--color-primary)]' : 'text-[var(--color-fg-muted)]'
                  )}
                >
                  <span className="capitalize">{WEEKDAY_LABELS[i]}</span>{' '}
                  <span className="tabular-nums">{day.getDate()}</span>
                </div>
              )
            })}
          </div>

          {/* Hele-dag-strook */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-[var(--color-border)]">
            <div className="px-1 py-1 text-right text-[9px] uppercase text-[var(--color-fg-muted)]">
              dag
            </div>
            {days.map((day) => {
              const items = allDayByDay.get(ymd(day)) ?? []
              return (
                <div
                  key={ymd(day)}
                  className="min-h-[28px] space-y-0.5 border-l border-[var(--color-border)] p-0.5"
                >
                  {items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={item.onClick}
                      title={item.label}
                      className="flex w-full items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: item.color.bg,
                        borderColor: item.color.border,
                        color: item.color.text,
                      }}
                    >
                      {item.type === 'klus' && <Wrench size={10} className="shrink-0" aria-hidden />}
                      {item.type === 'availability' && (
                        <span aria-hidden className="shrink-0">
                          🌴
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Uur-as + kolommen */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            {/* Uur-labels */}
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-[var(--color-fg-muted)]"
                  style={{ top: i * HOUR_PX }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Dagkolommen met tijdblokken */}
            {days.map((day) => {
              const items = timedByDay.get(ymd(day)) ?? []
              return (
                <div
                  key={ymd(day)}
                  className="relative border-l border-[var(--color-border)]"
                  style={{ height: gridHeight }}
                >
                  {/* Uur-lijnen */}
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-[var(--color-border)]/70"
                      style={{ top: i * HOUR_PX }}
                    />
                  ))}
                  {items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={item.onClick}
                      title={item.label}
                      className="absolute inset-x-0.5 flex items-start gap-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-80"
                      style={{
                        top: item.topPx,
                        height: item.heightPx,
                        backgroundColor: item.color.bg,
                        borderColor: item.color.border,
                        color: item.color.text,
                      }}
                    >
                      {item.type === 'klus' && (
                        <Wrench size={10} className="mt-0.5 shrink-0" aria-hidden />
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
