'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ArrowUpRight } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { BookingDetailSheet } from './BookingDetailSheet'

type BookingRow = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
  assignments?: Array<{
    staff_id: string
    profile?: { full_name: string | null } | null
  }>
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

function formatTimeRange(start: string | null, end: string | null) {
  if (!start && !end) return 'Hele dag'
  const fmt = (s: string) =>
    new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(s))
  if (start && end) return `${fmt(start)}–${fmt(end)}`
  if (start) return `vanaf ${fmt(start)}`
  return `tot ${fmt(end!)}`
}

function formatDateLong(d: Date) {
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}

function staffNames(rows: BookingRow['assignments']): string[] {
  if (!rows || rows.length === 0) return []
  return rows
    .map((a) => a.profile?.full_name?.split(' ')[0])
    .filter((n): n is string => !!n && n.length > 0)
}

export function TodayWidget({ refreshKey = 0 }: { refreshKey?: number }) {
  const [today, setToday] = useState<BookingRow[] | null>(null)
  const [next, setNext] = useState<{ date: string; client_name: string | null } | null>(null)
  const [selected, setSelected] = useState<BookingRow | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const todayIso = isoDate(new Date())

      const { data: todays } = await supabase
        .from('bookings')
        .select(
          '*, artist:artists(stage_name), assignments:booking_assignments(staff_id, profile:profiles(full_name))'
        )
        .eq('status', 'accepted')
        .eq('event_date', todayIso)
        .order('event_start', { ascending: true, nullsFirst: false })

      const todayRows = (todays as BookingRow[] | null) ?? []
      setToday(todayRows)
      setNext(null)

      if (todayRows.length === 0) {
        const { data: nextRows } = await supabase
          .from('bookings')
          .select('event_date, client_name')
          .eq('status', 'accepted')
          .gt('event_date', todayIso)
          .order('event_date', { ascending: true })
          .limit(1)
        const r = (nextRows as Array<{ event_date: string | null; client_name: string | null }> | null)?.[0]
        if (r?.event_date) setNext({ date: r.event_date, client_name: r.client_name })
      }
    } catch {
      // RLS / no-session — laat leeg, niet kritisch
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  if (today === null) return null // nog aan het laden — geen flicker

  const dateLabel = formatDateLong(new Date()).replace(/^(.)/, (m) => m.toUpperCase())

  if (today.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <header className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
          <CalendarClock size={14} /> Vandaag · {dateLabel}
        </header>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-fg)]">
            Geen klussen vandaag &mdash; lekker rustig.
            {next && (
              <>
                {' '}Eerstvolgende: <strong>{next.client_name ?? '(naam onbekend)'}</strong> op{' '}
                {new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date(next.date))}.
              </>
            )}
          </p>
          {next && (
            <Link
              href="/portal/admin/agenda"
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Naar agenda <ArrowUpRight size={12} />
            </Link>
          )}
        </div>
      </section>
    )
  }

  return (
    <>
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <header className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-5 py-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
          <CalendarClock size={14} /> Vandaag · {dateLabel}
        </span>
        <span className="text-xs text-[var(--color-fg-muted)]">{today.length} ingepland</span>
      </header>
      <ul className="divide-y divide-[var(--color-border)]">
        {today.map((b) => {
          const names = staffNames(b.assignments)
          const namesText =
            names.length === 0
              ? 'Geen crew'
              : names.length === 1
                ? names[0]
                : `${names[0]}+${names.length - 1}`
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setSelected(b)}
                className="group flex w-full items-stretch gap-4 px-5 py-3 text-left transition-colors hover:bg-[var(--color-surface-1)]"
              >
                <span
                  aria-hidden
                  className="w-1 shrink-0 rounded-full bg-[var(--color-primary)] opacity-70 group-hover:opacity-100"
                />
                <span className="grid flex-1 grid-cols-1 gap-1 text-sm sm:grid-cols-[140px_1fr_1fr_auto] sm:items-center sm:gap-3">
                  <span className="font-mono text-[13px] tabular-nums text-[var(--color-fg)]">
                    {formatTimeRange(b.event_start, b.event_end)}
                  </span>
                  <span className="text-[var(--color-fg)]">
                    <span className="font-medium">{b.client_name ?? '(geen naam)'}</span>
                    {b.artist?.stage_name && (
                      <span className="text-[var(--color-fg-muted)]"> · {b.artist.stage_name}</span>
                    )}
                  </span>
                  <span className="text-[var(--color-fg-secondary)]">{b.event_location ?? '—'}</span>
                  <span className="justify-self-start sm:justify-self-end">
                    <span
                      className={
                        names.length === 0
                          ? 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900'
                          : 'inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-1)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-fg)]'
                      }
                    >
                      {namesText}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
    <BookingDetailSheet
      booking={selected}
      open={!!selected}
      onOpenChange={(o) => !o && setSelected(null)}
      onChanged={() => {
        setSelected(null)
        load()
      }}
    />
    </>
  )
}
