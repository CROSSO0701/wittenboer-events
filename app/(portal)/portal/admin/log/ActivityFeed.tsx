'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

type LogRow = {
  id: string
  action: string
  entity: string
  entity_id: string | null
  metadata: unknown
  created_at: string
  actor_id: string | null
  actor?: { full_name: string | null; email: string | null } | null
}

const PAGE = 50

const ACTION_LABELS: Record<string, string> = {
  'booking.accepted': 'Booking geaccepteerd',
  'booking.declined': 'Booking afgewezen',
  'booking.assigned': 'Crew toegewezen',
  'booking.updated': 'Booking bewerkt',
  'booking.cancelled': 'Booking geannuleerd',
  'booking.synced': 'Booking gesynchroniseerd',
  'integration.google_connected': 'Google Agenda gekoppeld',
  'integration.artwinlive_saved': 'ArtwinLive feed bijgewerkt',
  'note.added': 'Notitie toegevoegd',
  'artist.invited': 'Artiest uitgenodigd',
  'artist.access_revoked': 'Artiest-toegang ingetrokken',
  'staff.invited': 'Crewlid uitgenodigd',
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  )
}

function entityLink(row: LogRow): string | null {
  if (row.entity === 'booking' && row.entity_id) {
    // Geen detail-route voor booking; link naar inbox
    return '/portal/admin'
  }
  if (row.entity === 'artist' && row.entity_id) {
    return '/portal/admin/artiesten'
  }
  if (row.entity === 'integration') {
    return '/portal/admin/integraties'
  }
  return null
}

export function ActivityFeed() {
  const [rows, setRows] = useState<LogRow[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('')
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)

  const load = useCallback(
    async (reset = false) => {
      setLoading(true)
      try {
        const supabase = createSupabaseBrowserClient()
        const from = reset ? 0 : offset
        let q = supabase
          .from('audit_log')
          .select('id, action, entity, entity_id, metadata, created_at, actor_id, actor:profiles!audit_log_actor_id_fkey(full_name, email)')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE - 1)
        if (filter) q = q.eq('action', filter)
        const { data, error } = await q
        if (error) {
          // eerste keer kan FK-naam mismatch geven; fallback zonder actor-relatie
          const fb = await supabase
            .from('audit_log')
            .select('id, action, entity, entity_id, metadata, created_at, actor_id')
            .order('created_at', { ascending: false })
            .range(from, from + PAGE - 1)
          const fbData = (fb.data as LogRow[] | null) ?? []
          setRows((prev) => (reset ? fbData : [...prev, ...fbData]))
          setOffset(from + fbData.length)
          setHasMore(fbData.length === PAGE)
          return
        }
        const next = (data as LogRow[] | null) ?? []
        setRows((prev) => (reset ? next : [...prev, ...next]))
        setOffset(from + next.length)
        setHasMore(next.length === PAGE)
      } finally {
        setLoading(false)
      }
    },
    [filter, offset]
  )

  // Initial load + reset on filter change
  useEffect(() => {
    setOffset(0)
    setRows([])
    setHasMore(true)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Verzamel unieke action-types voor het filter (eenmalig op basis van eerste fetch)
  useEffect(() => {
    if (rows.length === 0 || actions.length > 0) return
    setActions(Array.from(new Set(rows.map((r) => r.action))).sort())
  }, [rows, actions.length])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`rounded-full border px-3 py-1 text-xs ${
            filter === ''
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
              : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
          }`}
        >
          Alles
        </button>
        {Object.keys(ACTION_LABELS).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setFilter(a)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === a
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
            }`}
          >
            {ACTION_LABELS[a]}
          </button>
        ))}
      </div>

      {rows.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
          Nog geen activiteit voor dit filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2">Wanneer</th>
                <th className="px-4 py-2">Wat</th>
                <th className="px-4 py-2">Door</th>
                <th className="px-4 py-2">Onderwerp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const link = entityLink(r)
                return (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                  >
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)] whitespace-nowrap">
                      {fmt(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-fg)]">
                      {ACTION_LABELS[r.action] ?? r.action}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                      {r.actor?.full_name ?? r.actor?.email ?? (r.actor_id ? 'systeem' : '—')}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                      {link ? (
                        <Link href={link} className="hover:text-[var(--color-primary)]">
                          {r.entity}
                        </Link>
                      ) : (
                        r.entity
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && rows.length > 0 && (
        <div className="flex justify-center">
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
    </div>
  )
}
