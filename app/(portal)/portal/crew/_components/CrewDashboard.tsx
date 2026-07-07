'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus, Copy, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Badge } from '../../../../components/ui/badge'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { CrewItem } from '../../../../api/portal/crew/assignments/route'

function formatDate(d?: string | null) {
  if (!d) return 'Datum volgt'
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' }).format(
    new Date(d)
  )
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start) return null
  const fmt = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const s = fmt.format(new Date(start))
  const e = end ? fmt.format(new Date(end)) : null
  return e ? `${s} - ${e}` : s
}

export function CrewDashboard({ name }: { name: string }) {
  const [items, setItems] = useState<CrewItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/crew/assignments', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Status ${res.status}`)
      }
      const data = (await res.json()) as { items: CrewItem[] }
      setItems(data.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Splits in aankomend (vanaf vandaag) en geweest, o.b.v. datum.
  const { upcoming, past } = useMemo(() => {
    const upcoming: CrewItem[] = []
    const past: CrewItem[] = []
    if (!items) return { upcoming, past }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const it of items) {
      if (it.event_date && new Date(it.event_date) < today) past.push(it)
      else upcoming.push(it)
    }
    // Geweest: nieuwste bovenaan.
    past.reverse()
    return { upcoming, past }
  }, [items])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-[var(--color-fg)]">
          Hoi {name}, dit staat voor je klaar.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-fg-muted)]">
          Hieronder zie je alleen de klussen waar jij op bent ingepland. Zet ze in je eigen
          telefoon-agenda met de agenda-link onderaan.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
            Aankomende klussen
          </h2>
          {items && (
            <span className="text-xs text-[var(--color-fg-muted)]">{upcoming.length} ingepland</span>
          )}
        </header>

        {items === null && <ListSkeleton />}

        {items && upcoming.length === 0 && <CrewEmpty />}

        {items && upcoming.length > 0 && (
          <ul className="flex flex-col gap-3">
            {upcoming.map((it) => (
              <CrewCard key={`${it.kind}-${it.id}`} item={it} />
            ))}
          </ul>
        )}
      </section>

      {items && past.length > 0 && (
        <section>
          <header className="mb-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
              Geweest
            </h2>
          </header>
          <ul className="flex flex-col gap-3 opacity-70">
            {past.map((it) => (
              <CrewCard key={`${it.kind}-${it.id}`} item={it} />
            ))}
          </ul>
        </section>
      )}

      <CalendarLinkCard />
    </div>
  )
}

function CrewCard({ item }: { item: CrewItem }) {
  const time = formatTimeRange(item.event_start, item.event_end)
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-fg)]">
            {item.title}
          </span>
          {item.role_on_job && (
            <Badge tone="neutral">{item.role_on_job}</Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-fg-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[var(--color-fg-muted)]" />
            {formatDate(item.event_date)}
            {time && <span className="text-[var(--color-fg-muted)]">· {time}</span>}
          </span>
          {item.location && <span className="text-[var(--color-fg-muted)]">{item.location}</span>}
        </div>
      </div>
    </li>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4"
        >
          <div className="h-4 w-40 rounded bg-[var(--color-surface-1)]" />
          <div className="ml-auto h-4 w-24 rounded bg-[var(--color-surface-1)]" />
        </div>
      ))}
    </div>
  )
}

function CrewEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
      <CalendarPlus size={42} className="text-[var(--color-fg-muted)]" />
      <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-[var(--color-fg)]">
        Nog geen klussen
      </h3>
      <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
        Zodra je op een show of klus wordt ingepland, verschijnt die hier. Je krijgt er ook bericht
        van per e-mail of WhatsApp.
      </p>
    </div>
  )
}

// Persoonlijke ICS-feed: hergebruikt ensure_calendar_feed_token (per profiel).
function CalendarLinkCard() {
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate() {
    setBusy(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.rpc('ensure_calendar_feed_token')
      if (error) {
        toast.error(error.message)
        return
      }
      setToken(data as unknown as string)
      toast.success('Agenda-link gemaakt')
    } finally {
      setBusy(false)
    }
  }

  const url = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/${token}.ics`
    : ''

  async function copyUrl() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link gekopieerd')
    } catch {
      toast.error('Kopiëren faalde')
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
      <div className="flex items-center gap-2">
        <LinkIcon size={18} className="text-[var(--color-primary)]" />
        <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
          Mijn agenda-link
        </h2>
      </div>
      <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
        Krijg al jouw ingeplande klussen automatisch in de agenda-app op je telefoon (Google,
        Apple of Outlook). Eén persoonlijke link die zichzelf bijwerkt.
      </p>

      {!token && (
        <Button onClick={generate} disabled={busy} className="mt-4" size="sm">
          {busy ? 'Bezig…' : 'Maak mijn agenda-link'}
        </Button>
      )}

      {token && (
        <div className="mt-4 flex flex-col gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <div className="flex gap-2">
            <Button onClick={copyUrl} size="sm" variant="ghost">
              <Copy size={14} /> Kopieer link
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-transparent px-3 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Open in agenda <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-xs text-[var(--color-fg-muted)]">
            Plak deze link in je agenda-app om in te schrijven op de kalender. In Google Agenda:
            &ldquo;Andere agenda&rsquo;s&rdquo; → &ldquo;Toevoegen via URL&rdquo;. Behandel hem als
            een wachtwoord.
          </p>
        </div>
      )}
    </section>
  )
}
