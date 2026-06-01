'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink, Calendar, Rss, Mail, CheckCircle2, AlertCircle, Copy, Link as LinkIcon } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

type Props = {
  google: { connected: boolean; calendarId: string | null; updatedAt: string | null }
  artwin: { icalUrl: string | null; updatedAt: string | null }
  resend: { connected: boolean }
}

function fmt(d: string | null) {
  if (!d) return null
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(d)
  )
}

export function IntegrationsBoard({ google, artwin, resend }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GoogleCard {...google} />
      <ArtwinCard initialUrl={artwin.icalUrl ?? ''} updatedAt={artwin.updatedAt} />
      <FeedCard />
      <ResendCard connected={resend.connected} />
    </div>
  )
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'
      }`}
    />
  )
}

function CardShell({
  icon,
  title,
  ok,
  children,
}: {
  icon: React.ReactNode
  title: string
  ok: boolean
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-5 py-3">
        <div className="flex items-center gap-2 text-[var(--color-fg)]">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
          <StatusDot ok={ok} />
          {ok ? 'Gekoppeld' : 'Niet gekoppeld'}
        </span>
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function GoogleCard({
  connected,
  calendarId,
  updatedAt,
}: {
  connected: boolean
  calendarId: string | null
  updatedAt: string | null
}) {
  return (
    <CardShell icon={<Calendar size={18} />} title="Google Agenda" ok={connected}>
      <p className="text-sm text-[var(--color-fg-secondary)]">
        Wittenboer-aanvragen worden automatisch in jouw agenda gezet zodra je ze accepteert.
      </p>
      {connected && calendarId && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-[var(--color-fg)]">
          <CheckCircle2 size={14} className="mt-0.5 text-emerald-600" />
          <span>
            Verbonden met <strong>{calendarId}</strong>
            {updatedAt && (
              <span className="text-[var(--color-fg-muted)]"> · sinds {fmt(updatedAt)}</span>
            )}
          </span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href="/api/oauth/google/start"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          {connected ? 'Opnieuw verbinden' : 'Verbind met Google'}
        </a>
      </div>
      {!connected && (
        <p className="mt-3 text-xs text-[var(--color-fg-muted)]">
          Eenmalige toestemming. Daarna gebeurt het automatisch.
        </p>
      )}
    </CardShell>
  )
}

function ArtwinCard({
  initialUrl,
  updatedAt,
}: {
  initialUrl: string
  updatedAt: string | null
}) {
  const [url, setUrl] = useState(initialUrl)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/integrations/artwinlive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_url: url || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Verbinding opgeslagen')
    } finally {
      setSaving(false)
    }
  }

  async function test() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/integrations/artwinlive', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setTestResult(`Fout: ${data.error ?? 'onbekend'}`)
        toast.error(`Feed-test faalde`)
      } else {
        setTestResult(`Feed werkt — ${data.count} events gevonden`)
        toast.success(`${data.count} events in feed`)
      }
    } finally {
      setTesting(false)
    }
  }

  const ok = !!initialUrl

  return (
    <CardShell icon={<Rss size={18} />} title="ArtwinLive" ok={ok}>
      <p className="text-sm text-[var(--color-fg-secondary)]">
        Importeer je gigs van ArtwinLive. Plak de privé-link uit ArtwinLive hieronder. We
        halen elke ochtend automatisch nieuwe gigs op.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ical-url">Privé-link uit ArtwinLive</Label>
          <Input
            id="ical-url"
            type="url"
            placeholder="https://artwinlive.nl/calendar/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={test}
            disabled={testing || !ok}
          >
            {testing ? 'Testen…' : 'Test verbinding'}
          </Button>
        </div>
        {testResult && (
          <p
            className={`flex items-center gap-1.5 text-xs ${
              testResult.startsWith('Feed werkt') ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {testResult.startsWith('Feed werkt') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {testResult}
          </p>
        )}
        <p className="text-xs text-[var(--color-fg-muted)]">
          Nieuwe gigs verschijnen vanzelf in je inbox en Google Agenda.
          {updatedAt && <> Bijgewerkt op {fmt(updatedAt)}.</>}
        </p>
      </div>
    </CardShell>
  )
}

function FeedCard() {
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
      toast.success('Feed-URL gegenereerd')
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
      toast.success('URL gekopieerd')
    } catch {
      toast.error('Kopiëren faalde')
    }
  }

  return (
    <CardShell icon={<LinkIcon size={18} />} title="Mijn agenda-link" ok={!!token}>
      <p className="text-sm text-[var(--color-fg-secondary)]">
        Krijg al je geaccepteerde klussen automatisch in een agenda van jouw keuze (Google,
        Apple, Outlook). Eén persoonlijke link, blijft up-to-date.
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
            Plak deze link in Google Agenda → &ldquo;Andere agenda&rsquo;s&rdquo; → &ldquo;Toevoegen via URL&rdquo;.
            Behandel hem als een wachtwoord — wie hem heeft, kan je klussen meekijken.
          </p>
        </div>
      )}
    </CardShell>
  )
}

function ResendCard({ connected }: { connected: boolean }) {
  return (
    <CardShell icon={<Mail size={18} />} title="Mail-service" ok={connected}>
      <p className="text-sm text-[var(--color-fg-secondary)]">
        Bevestigingen aan klanten en artiesten, en berichtjes naar crew gaan via deze mail-service.
      </p>
      <p className="mt-3 text-xs text-[var(--color-fg-muted)]">
        {connected
          ? 'Mail werkt — alles wordt automatisch verstuurd.'
          : 'Nog niet ingesteld. Vraag de developer om dit te activeren — pas dan worden mails ook echt verstuurd.'}
      </p>
    </CardShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
        {label}
      </dt>
      <dd className="truncate text-right text-sm text-[var(--color-fg)]">{value}</dd>
    </div>
  )
}
