'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import { cn } from '../../../../lib/utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'

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
  'booking.accepted': 'Boeking geaccepteerd',
  'booking.declined': 'Boeking afgewezen',
  'booking.assigned': 'Crew toegewezen',
  'booking.updated': 'Boeking bewerkt',
  'booking.cancelled': 'Boeking geannuleerd',
  'booking.synced': 'Boeking gesynchroniseerd',
  'integration.google_connected': 'Google Agenda gekoppeld',
  'integration.artwinlive_saved': 'Artwin-koppeling bijgewerkt',
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
          let fbq = supabase
            .from('audit_log')
            .select('id, action, entity, entity_id, metadata, created_at, actor_id')
            .order('created_at', { ascending: false })
            .range(from, from + PAGE - 1)
          if (filter) fbq = fbq.eq('action', filter)
          const fb = await fbq
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                filter === ''
                  ? 'border-[var(--color-border)] bg-white text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
                  : 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
              )}
            >
              <SlidersHorizontal size={13} className="shrink-0" aria-hidden />
              {filter === '' ? 'Type: alles' : ACTION_LABELS[filter] ?? filter}
              <ChevronDown size={13} className="shrink-0 opacity-60" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Type activiteit</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setFilter('')}>
              <Check size={14} className={cn('shrink-0', filter === '' ? 'opacity-100' : 'opacity-0')} aria-hidden />
              Alles
            </DropdownMenuItem>
            {Object.keys(ACTION_LABELS).map((a) => (
              <DropdownMenuItem key={a} onSelect={() => setFilter(a)}>
                <Check size={14} className={cn('shrink-0', filter === a ? 'opacity-100' : 'opacity-0')} aria-hidden />
                {ACTION_LABELS[a]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {rows.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
          Nog geen activiteit voor dit filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[640px] text-sm">
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
