'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { InboxBoard } from './InboxBoard'
import { TodayWidget } from './TodayWidget'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}

type Stats = {
  pending: number
  thisWeek: number
  thisWeekDelta: number | null
  weekend: number
  staffPlanned: number
}

type ActivityItem = { id: string; text: string; when: string }

const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function relativeDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Vandaag'
  if (diff === 1) return 'Morgen'
  if (diff === -1) return 'Gisteren'
  if (diff > 0 && diff < 7) {
    return new Intl.DateTimeFormat('nl-NL', { weekday: 'long' }).format(d)
  }
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(d)
}

function fmtAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'zojuist'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} u`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d`
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    thisWeek: 0,
    thisWeekDelta: null,
    weekend: 0,
    staffPlanned: 0,
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()

      const { data: pendingBookings, error: bErr } = await supabase
        .from('bookings')
        .select('*, artist:artists(stage_name)')
        .eq('status', 'pending')
        .order('event_date', { ascending: true, nullsFirst: false })
      if (bErr) throw bErr
      setBookings((pendingBookings as Booking[]) ?? [])

      // Eén RPC-call voor alle stats — ontwijkt PostgREST HEAD-quirks
      const { data: rows, error: statsErr } = await supabase.rpc('dashboard_stats')
      if (!statsErr && rows && rows.length > 0) {
        const r = rows[0] as {
          open: number
          this_week: number
          last_week: number
          weekend: number
          staff_planned: number
        }
        setStats({
          pending: r.open ?? 0,
          thisWeek: r.this_week ?? 0,
          thisWeekDelta: r.last_week == null ? null : (r.this_week ?? 0) - r.last_week,
          weekend: r.weekend ?? 0,
          staffPlanned: r.staff_planned ?? 0,
        })
      }

      const { data: recent } = await supabase
        .from('bookings')
        .select('id, status, client_name, decided_at, updated_at, source, artist:artists(stage_name)')
        .order('updated_at', { ascending: false })
        .limit(8)

      type RecentRow = {
        id: string
        status: string
        client_name: string | null
        decided_at: string | null
        updated_at: string
        source: string
        artist?: { stage_name: string | null } | null
      }
      const items: ActivityItem[] = ((recent as RecentRow[] | null) ?? []).map((r) => {
        const who = r.client_name ?? r.artist?.stage_name ?? 'onbekend'
        const text =
          r.status === 'accepted' && r.decided_at
            ? `Geaccepteerd · ${who}`
            : r.status === 'declined' && r.decided_at
              ? `Afgewezen · ${who}`
              : r.source === 'artwinlive'
                ? `ArtwinLive sync · ${who}`
                : `Aanvraag binnen · ${who}`
        return { id: r.id, text, when: fmtAgo(r.updated_at) }
      })
      setActivity(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const calendarRows = useMemo(() => {
    const days: { iso: string; label: string; isWeekend: boolean }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 14; i++) {
      const d = addDays(today, i)
      const dow = d.getDay()
      days.push({
        iso: isoDate(d),
        label: new Intl.DateTimeFormat('nl-NL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(d),
        isWeekend: dow === 0 || dow === 6,
      })
    }
    return days
  }, [])

  return (
    <div className="space-y-8">
      <TodayWidget />
      <StatsRow stats={stats} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
              Inbox
            </h2>
            <span className="text-xs text-[var(--color-fg-muted)]">
              {bookings == null ? 'Laden…' : `${bookings.length} openstaand`}
            </span>
          </header>
          <InboxBoard
            bookings={bookings}
            error={error}
            relativeDate={relativeDate}
            onChanged={load}
          />
        </section>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card title="Komende 14 dagen">
            <ul className="divide-y divide-[var(--color-border)]">
              {calendarRows.map((row) => (
                <li
                  key={row.iso}
                  className={`flex items-center justify-between px-3 py-1.5 text-sm ${
                    row.isWeekend ? 'bg-[var(--color-tertiary-soft)]/40' : ''
                  }`}
                >
                  <span className="capitalize text-[var(--color-fg-secondary)]">{row.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Recente activiteit" icon={<Sparkles size={14} />}>
            {activity.length === 0 ? (
              <p className="px-3 py-3 text-xs text-[var(--color-fg-muted)]">Nog geen activiteit.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 px-3 py-2 text-xs"
                  >
                    <span className="text-[var(--color-fg)]">{a.text}</span>
                    <span className="shrink-0 text-[var(--color-fg-muted)]">{a.when}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Link
            href="/portal/admin/integraties"
            className="block rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <span className="flex items-center justify-between">
              Integraties beheren
              <ArrowUpRight size={14} />
            </span>
          </Link>
        </aside>
      </div>
    </div>
  )
}

function StatsRow({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Wacht op antwoord', value: stats.pending, sub: 'aanvragen' },
    {
      label: 'Deze week op pad',
      value: stats.thisWeek,
      sub:
        stats.thisWeekDelta == null
          ? 'shows ingepland'
          : stats.thisWeekDelta > 0
            ? `+${stats.thisWeekDelta} t.o.v. vorige week`
            : `${stats.thisWeekDelta} t.o.v. vorige week`,
    },
    { label: 'Komend weekend', value: stats.weekend, sub: 'za + zo' },
    { label: 'Crew ingepland', value: stats.staffPlanned, sub: 'komende 7 dagen' },
  ]
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-[var(--color-border-strong)] bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
            {c.label}
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-5xl leading-none text-[var(--color-fg)]">
            {c.value}
          </div>
          <div className="mt-2 text-xs text-[var(--color-fg-muted)]">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
        <span>{title}</span>
        {icon}
      </header>
      {children}
    </section>
  )
}
