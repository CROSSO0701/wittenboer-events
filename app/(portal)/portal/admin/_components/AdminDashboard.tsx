'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import { fmtAgo } from '../../../../lib/format'
import { TodayWidget, type TodayInitial } from './TodayWidget'
import { WachtOpJou, type FeedInitial } from './WachtOpJou'

export type Stats = {
  pending: number
  thisWeek: number
  thisWeekDelta: number | null
  weekend: number
  staffPlanned: number
}

export type ActivityItem = { id: string; text: string; when: string }

const EMPTY_STATS: Stats = {
  pending: 0,
  thisWeek: 0,
  thisWeekDelta: null,
  weekend: 0,
  staffPlanned: 0,
}

const TODO_ANCHOR = 'wacht-op-jou'

export function AdminDashboard({
  initialStats,
  initialActivity,
  initialToday,
  initialFeed,
}: {
  // Server-voorgeladen data (best-effort). Ontbreekt deze, dan gedraagt het
  // dashboard zich exact als voorheen: skeleton/leeg → client-fetch in useEffect.
  initialStats?: Stats
  initialActivity?: ActivityItem[]
  initialToday?: TodayInitial
  initialFeed?: FeedInitial
} = {}) {
  const [stats, setStats] = useState<Stats>(initialStats ?? EMPTY_STATS)
  const [todoCount, setTodoCount] = useState<number | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity ?? [])

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()

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
                ? `Artwin-import · ${who}`
                : `Aangevraagd · ${who}`
        return { id: r.id, text, when: fmtAgo(r.updated_at) }
      })
      setActivity(items)
    } catch {
      // RLS / geen sessie — stats/activiteit blijven leeg, niet kritisch
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const scrollToTodo = useCallback(() => {
    document.getElementById(TODO_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Live aantal openstaande to-do-items (boekingen + losse aanvragen).
  // Valt terug op de RPC-waarde zolang de lijst nog laadt.
  const waiting = todoCount ?? stats.pending

  return (
    <div className="space-y-8">
      <TodayWidget initial={initialToday} />

      <WachtOpJou anchorId={TODO_ANCHOR} onCount={setTodoCount} initial={initialFeed} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <StatsRow stats={stats} waiting={waiting} onWaitingClick={scrollToTodo} />

        <aside>
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
        </aside>
      </div>
    </div>
  )
}

function StatsRow({
  stats,
  waiting,
  onWaitingClick,
}: {
  stats: Stats
  waiting: number
  onWaitingClick: () => void
}) {
  const cards = [
    { label: 'Wacht op antwoord', value: waiting, sub: 'open · naar lijst', onClick: onWaitingClick },
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const base =
          'rounded-2xl border border-[var(--color-border-strong)] bg-white p-4 text-left transition-shadow'
        const inner = (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
              {c.label}
            </div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-4xl leading-none text-[var(--color-fg)]">
              {c.value}
            </div>
            <div className="mt-1.5 text-xs text-[var(--color-fg-muted)]">{c.sub}</div>
          </>
        )
        return c.onClick ? (
          <button
            key={c.label}
            type="button"
            onClick={c.onClick}
            className={`${base} hover:border-[var(--color-primary)] hover:shadow-md`}
          >
            {inner}
          </button>
        ) : (
          <div key={c.label} className={`${base} hover:shadow-md`}>
            {inner}
          </div>
        )
      })}
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
