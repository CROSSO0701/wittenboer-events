'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Inbox, MapPin, Clock } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { BookingDetailSheet } from '../_components/BookingDetailSheet'

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}

// Lokale datum-bucket (geen UTC-truc) zodat de dag-groepering klopt in NL.
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function dayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}
function timeLabel(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function InkomendBoard() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)

  const load = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*, artist:artists(stage_name)')
        .eq('source', 'artwinlive')
        .eq('status', 'pending')
        .gte('event_date', ymd(new Date()))
        .order('event_date', { ascending: true, nullsFirst: false })
        .order('event_start', { ascending: true, nullsFirst: false })
      if (err) throw new Error(err.message)
      setBookings((data as unknown as Booking[]) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const grouped = useMemo(() => {
    if (!bookings) return null
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      const k = b.event_date ?? 'zonder-datum'
      const arr = map.get(k)
      if (arr) arr.push(b)
      else map.set(k, [b])
    }
    return [...map.entries()]
  }, [bookings])

  async function acceptAll() {
    setBusy(true)
    setConfirmAll(false)
    try {
      const res = await fetch('/api/admin/artwin/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      const msg =
        data.calendarFailed > 0
          ? `${data.accepted} geaccepteerd, ${data.calendarFailed} agenda-fout. Controleer die.`
          : `${data.accepted} gigs geaccepteerd en op de agenda gezet.`
      toast.success(msg)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Accepteren faalde')
    } finally {
      setBusy(false)
    }
  }

  const count = bookings?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
            Inkomend uit Artwin
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-[var(--color-fg)]">
            {count} {count === 1 ? 'gig' : 'gigs'} om te bevestigen
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-fg-muted)]">
            Artwin-boekingen komen hier binnen. Open een gig om datum, tijd, locatie of beschrijving aan te
            passen en te accepteren, of zet alles in één keer op de agenda.
          </p>
        </div>
        {count > 0 &&
          (confirmAll ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-fg)]">Alle {count} accepteren?</span>
              <Button variant="ghost" onClick={() => setConfirmAll(false)} disabled={busy}>
                Nee
              </Button>
              <Button onClick={acceptAll} disabled={busy}>
                {busy ? 'Bezig…' : 'Ja, accepteer alles'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setConfirmAll(true)} disabled={busy}>
              Accepteer alles ({count})
            </Button>
          ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : bookings == null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--color-surface-1)]" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
          <Inbox size={42} className="text-[var(--color-fg-muted)]" />
          <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
            Niets in de wachtrij.
          </h3>
          <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
            Nieuwe Artwin-gigs verschijnen hier zodra ze binnenkomen.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(grouped ?? []).map(([date, items]) => (
            <div key={date}>
              <div className="mb-2 text-sm font-semibold capitalize text-[var(--color-fg)]">
                {date === 'zonder-datum' ? 'Zonder datum' : dayLabel(date)}
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                {items.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected(b)}
                    className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--color-surface-1)]"
                  >
                    <span className="inline-flex w-14 shrink-0 items-center gap-1 text-sm text-[var(--color-fg-secondary)]">
                      {b.event_start ? (
                        <>
                          <Clock size={13} /> {timeLabel(b.event_start)}
                        </>
                      ) : (
                        <span className="text-[var(--color-fg-muted)]">hele dag</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--color-fg)]">
                        {b.client_name ?? '(geen naam)'}
                      </span>
                      {b.event_location && (
                        <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--color-fg-muted)]">
                          <MapPin size={12} className="shrink-0" /> {b.event_location}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs font-medium text-[var(--color-fg)]">
                      Bekijken
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    </div>
  )
}
