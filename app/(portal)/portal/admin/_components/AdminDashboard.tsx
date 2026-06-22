'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, CalendarClock, CheckCircle2, Inbox, Sparkles, Users } from 'lucide-react'
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
  const [today, setToday] = useState<TodaySummary | null>(
    initialToday
      ? { count: initialToday.today.length, needCrew: countNeedCrew(initialToday.today) }
      : null
  )
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

  // "U bent bij": alleen tonen als beide lijsten geladen zijn (niet null) én leeg.
  // Zolang er nog geladen wordt blijven de blokken zelf hun skeleton tonen.
  const todoLoaded = todoCount !== null
  const todayLoaded = today !== null
  const allClear = todoLoaded && todayLoaded && waiting === 0 && (today?.count ?? 0) === 0

  return (
    <div className="space-y-8">
      <PriorityStrip
        waiting={waiting}
        waitingLoaded={todoLoaded}
        today={today}
        allClear={allClear}
        onWaitingClick={scrollToTodo}
      />

      <TodayWidget initial={initialToday} onSummary={setToday} />

      <WachtOpJou anchorId={TODO_ANCHOR} onCount={setTodoCount} initial={initialFeed} />

      {/* Cijfers + activiteit — ondergeschikt, onderaan en visueel ingetogen. */}
      <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)]/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)] [&::-webkit-details-marker]:hidden">
          <span>Cijfers en recente activiteit</span>
          <ArrowDown
            size={14}
            className="shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="grid gap-6 px-4 pb-4 lg:grid-cols-[1fr_320px]">
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
      </details>
    </div>
  )
}

/** Beknopte samenvatting van de Vandaag-data, gemeld door TodayWidget. */
export type TodaySummary = { count: number; needCrew: number }

function countNeedCrew(rows: TodayInitial['today']): number {
  return rows.filter((b) => !b.assignments || b.assignments.length === 0).length
}

/**
 * Prioriteitsstrip bovenaan het scherm: in één oogopslag wat actie vraagt.
 * Drie duim-vriendelijke regels (>=44px): nieuwe aanvragen, gigs vandaag,
 * gigs zonder crew. Elke regel tikt door naar de juiste plek. Is er niets te
 * doen, dan een vriendelijke "u bent bij"-staat.
 */
function PriorityStrip({
  waiting,
  waitingLoaded,
  today,
  allClear,
  onWaitingClick,
}: {
  waiting: number
  waitingLoaded: boolean
  today: TodaySummary | null
  allClear: boolean
  onWaitingClick: () => void
}) {
  if (allClear) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-6 py-8 text-center">
        <CheckCircle2 size={36} className="text-[var(--color-primary)]" />
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-[var(--color-fg)]">
          U bent bij
        </h2>
        <p className="text-sm text-[var(--color-fg-muted)]">
          Geen openstaande acties. Nieuwe aanvragen verschijnen hier zodra ze binnenkomen.
        </p>
      </section>
    )
  }

  const todayCount = today?.count ?? 0
  const needCrew = today?.needCrew ?? 0

  const rows: PriorityRowProps[] = []

  // (1) Nieuwe aanvragen / openstaande boekingen.
  if (!waitingLoaded || waiting > 0) {
    rows.push({
      kind: 'waiting',
      value: waitingLoaded ? waiting : null,
      title: 'Wacht op u',
      sub: 'Nieuwe aanvragen en boekingen om af te handelen',
      onClick: onWaitingClick,
    })
  }

  // (2) Gigs vandaag (alleen als er gigs zijn — anders toont TodayWidget zelf
  //     al een nette "geen klussen vandaag"-staat).
  if (todayCount > 0) {
    rows.push({
      kind: 'today',
      value: todayCount,
      title: todayCount === 1 ? '1 klus vandaag' : `${todayCount} klussen vandaag`,
      sub: 'Bekijk tijden, locatie en crew',
      href: '/portal/admin/agenda',
    })
  }

  // (3) Klussen vandaag zonder crew (directe toewijzing via het Vandaag-blok).
  if (needCrew > 0) {
    rows.push({
      kind: 'crew',
      value: needCrew,
      title: needCrew === 1 ? '1 klus zonder crew' : `${needCrew} klussen zonder crew`,
      sub: 'Wijs crew toe in het Vandaag-overzicht hieronder',
      href: '#vandaag',
    })
  }

  if (rows.length === 0) return null

  return (
    <section aria-label="Vandaag" className="space-y-2">
      <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
        Vandaag
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-white">
        {rows.map((r, i) => (
          <li key={r.kind} className={i > 0 ? 'border-t border-[var(--color-border)]' : ''}>
            <PriorityRow {...r} />
          </li>
        ))}
      </ul>
    </section>
  )
}

type PriorityRowProps = {
  kind: 'waiting' | 'today' | 'crew'
  value: number | null
  title: string
  sub: string
  href?: string
  onClick?: () => void
}

const ROW_ICON: Record<PriorityRowProps['kind'], typeof Inbox> = {
  waiting: Inbox,
  today: CalendarClock,
  crew: Users,
}

function PriorityRow({ kind, value, title, sub, href, onClick }: PriorityRowProps) {
  const Icon = ROW_ICON[kind]
  const accent = kind === 'crew'
  const inner = (
    <>
      <span
        className={
          accent
            ? 'grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-900'
            : 'grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-primary)]'
        }
      >
        {value === null ? (
          <span className="h-4 w-4 animate-pulse rounded bg-[var(--color-border)]" />
        ) : (
          <span className="font-[family-name:var(--font-display)] text-xl leading-none tabular-nums">
            {value}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-fg)]">
          <Icon size={15} className="shrink-0 text-[var(--color-fg-muted)]" />
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--color-fg-muted)]">{sub}</span>
      </span>
      <ArrowDown
        size={16}
        className="shrink-0 -rotate-90 text-[var(--color-fg-muted)]"
        aria-hidden
      />
    </>
  )
  const base =
    'flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-1)]'
  if (href) {
    // Hash-anchor (#vandaag) blijft in-page; echte routes navigeren.
    return (
      <a href={href} className={base}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      {inner}
    </button>
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
