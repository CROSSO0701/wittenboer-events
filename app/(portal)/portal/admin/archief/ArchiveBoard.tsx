'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { StatusBadge } from '../../_components/StatusBadge'
import { BookingDetailSheet } from '../_components/BookingDetailSheet'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { formatEUR, sourceLabel } from '../../../../lib/format'

type Row = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}

const PAGE = 25

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(d))
}

export function ArchiveBoard() {
  const [rows, setRows] = useState<Row[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Row | null>(null)

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const today = new Date().toISOString().slice(0, 10)
      const from = reset ? 0 : offset
      const { data } = await supabase
        .from('bookings')
        .select('*, artist:artists(stage_name)')
        .lt('event_date', today)
        .order('event_date', { ascending: false, nullsFirst: false })
        .range(from, from + PAGE - 1)
      const next = (data as Row[] | null) ?? []
      setRows((prev) => (reset ? next : [...prev, ...next]))
      setOffset(from + next.length)
      setHasMore(next.length === PAGE)
    } finally {
      setLoading(false)
    }
  }, [offset])

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = query
    ? rows.filter((r) => {
        const q = query.toLowerCase()
        return [r.client_name, r.event_location, r.artist?.stage_name, r.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
    : rows

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--color-fg-muted)]">{rows.length} geladen</span>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
          <Input
            placeholder="Zoeken..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-56 pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
          {rows.length === 0
            ? 'Nog niets in het archief — alle bookings zijn nog actueel.'
            : 'Geen resultaten voor je zoekopdracht.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2">Datum</th>
                <th className="px-4 py-2">Bron</th>
                <th className="px-4 py-2">Klant</th>
                <th className="px-4 py-2">Artiest</th>
                <th className="px-4 py-2">Locatie</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Gage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                >
                  <td className="px-4 py-3 text-[var(--color-fg)]">{formatDate(b.event_date)}</td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{sourceLabel(b.source)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg)]">{b.client_name ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{b.artist?.stage_name ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{b.event_location ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-fg-secondary)]">{formatEUR(b.fee_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && rows.length > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="rounded-full border border-[var(--color-border-strong)] px-4 py-1.5 text-xs text-[var(--color-fg)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
          >
            {loading ? 'Laden…' : 'Toon meer'}
          </button>
        </div>
      )}

      <BookingDetailSheet
        booking={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={() => {
          setSelected(null)
          load(true)
        }}
      />
    </>
  )
}
