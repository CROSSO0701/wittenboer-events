'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { StatusBadge } from '../../_components/StatusBadge'
import { BookingDetailSheet } from './BookingDetailSheet'
import { cn } from '../../../../lib/utils/cn'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}

const SOURCE_LABEL: Record<string, string> = {
  artist: 'Artiest',
  client: 'Klant',
  artwinlive: 'ArtwinLive',
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

export function AgendaBoard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'upcoming' | 'all'>('upcoming')
  const [source, setSource] = useState<'all' | 'own' | 'artwinlive'>('all')
  const [selected, setSelected] = useState<Booking | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const since = new Date()
      since.setDate(since.getDate() - 31)
      const { data, error: qErr } = await supabase
        .from('bookings')
        .select('*, artist:artists(stage_name)')
        .not('event_date', 'is', null)
        .gte('event_date', since.toISOString().slice(0, 10))
        .order('event_date', { ascending: true })
        .order('event_start', { ascending: true, nullsFirst: true })
      if (qErr) throw qErr
      setBookings((data as Booking[]) ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groups = useMemo(() => {
    if (!bookings) return null
    const t0 = new Date()
    t0.setHours(0, 0, 0, 0)
    const filtered = bookings.filter((b) => {
      if (source === 'own' && b.source === 'artwinlive') return false
      if (source === 'artwinlive' && b.source !== 'artwinlive') return false
      const isDead = b.status === 'cancelled' || b.status === 'declined'
      if (scope === 'upcoming') {
        if (isDead) return false
        return b.event_date ? new Date(b.event_date).getTime() >= t0.getTime() : false
      }
      return true
    })
    const map = new Map<string, Booking[]>()
    for (const b of filtered) {
      const key = b.event_date ?? '—'
      const arr = map.get(key) ?? []
      arr.push(b)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [bookings, scope, source])

  const total = groups?.reduce((n, [, v]) => n + v.length, 0) ?? 0

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
        <span className="ml-auto text-xs text-[var(--color-fg-muted)]">
          {bookings == null ? 'Laden…' : `${total} boeking${total === 1 ? '' : 'en'}`}
        </span>
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
            Geen boekingen
          </h3>
          <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
            Geaccepteerde shows en aanvragen met een datum verschijnen hier, op datum gesorteerd.
          </p>
        </div>
      )}

      {groups?.map(([date, items]) => (
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
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            {items.map((b) => (
              <button
                key={b.id}
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
          </div>
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
    </div>
  )
}
