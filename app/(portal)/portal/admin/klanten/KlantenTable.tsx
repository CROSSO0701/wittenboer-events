'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '../../../../components/ui/input'
import { formatEUR } from '../../../../lib/format'

export type ClientRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  total_bookings: number
  total_value_cents: number
  last_booking_at: string | null
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(d))
}

export function KlantenTable({ rows }: { rows: ClientRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) =>
      [c.name, c.email, c.phone].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [rows, query])

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
        Nog geen klanten geregistreerd. Bookings met een klant-email-adres voegen automatisch klanten
        toe.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--color-fg-muted)]">
          {query.trim() ? `${filtered.length} van ${rows.length}` : `${rows.length} klanten`}
        </span>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]"
          />
          <Input
            placeholder="Zoek op naam, e-mail of telefoon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-72 pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
          Geen klanten gevonden voor uw zoekopdracht.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2">Naam</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Telefoon</th>
                <th className="px-4 py-2 text-right">Bookings</th>
                <th className="px-4 py-2 text-right">Omzet</th>
                <th className="px-4 py-2">Laatste</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/admin/klanten/${c.id}`}
                      className="font-medium text-[var(--color-fg)] hover:text-[var(--color-primary)]"
                    >
                      {c.name ?? '(geen naam)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-[var(--color-fg)]">{c.total_bookings}</td>
                  <td className="px-4 py-3 text-right text-[var(--color-fg)]">
                    {formatEUR(c.total_value_cents)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                    {formatDate(c.last_booking_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
