'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '../../../../components/ui/badge'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import { CONTACT_STATUS_LABEL, INQUIRY_STATUS_LABEL, relativeDate } from '../../../../lib/format'
import { StatusSelect } from './StatusSelect'

type InquiryType = 'contact' | 'show-package' | 'artist-booking'

type ContactRow = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  status: 'new' | 'replied' | 'closed'
  created_at: string
}
type DiscoRow = {
  id: string
  name: string
  email: string
  phone: string | null
  event_date: string | null
  guest_count: number | null
  location: string | null
  status: 'new' | 'contacted' | 'quoted' | 'booked' | 'closed'
  created_at: string
  package?: { name: string } | null
}
type ArtistBookingRow = {
  id: string
  name: string
  email: string
  phone: string | null
  event_date: string | null
  event_location: string | null
  status: 'new' | 'contacted' | 'quoted' | 'booked' | 'closed'
  created_at: string
  artist?: { stage_name: string } | null
}

const CONTACT_STATUSES = ['new', 'replied', 'closed'] as const
const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'closed'] as const

export function InquiriesPanel({ onChanged }: { onChanged?: () => void }) {
  const [contact, setContact] = useState<ContactRow[]>([])
  const [disco, setDisco] = useState<DiscoRow[]>([])
  const [artist, setArtist] = useState<ArtistBookingRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const [c, d, a] = await Promise.all([
        supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false }),
        supabase
          .from('disco_inquiries')
          .select('*, package:disco_packages(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('artist_booking_inquiries')
          .select('*, artist:artists(stage_name)')
          .order('created_at', { ascending: false }),
      ])
      if (c.error || d.error || a.error) {
        throw new Error(c.error?.message ?? d.error?.message ?? a.error?.message ?? 'Fout')
      }
      setContact((c.data as ContactRow[]) ?? [])
      setDisco((d.data as DiscoRow[]) ?? [])
      setArtist((a.data as ArtistBookingRow[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function updateStatus(type: InquiryType, id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/inquiries/${type}/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Status bijgewerkt')
      load()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bijwerken faalde')
    }
  }

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>

  if (loading) {
    return (
      <div className="space-y-10">
        {['Contact', 'Show-pakketten', 'Artiest-boekingen'].map((title) => (
          <section key={title}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-wide text-[var(--color-fg)]">
                {title}
              </h3>
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl border border-[var(--color-border)] bg-white"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <Section title="Contact" subtitle={`${contact.length} aanvragen`}>
        {contact.length === 0 ? (
          <Empty />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Naam</Th>
                <Th>E-mail</Th>
                <Th>Onderwerp</Th>
                <Th>Datum</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {contact.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <Td>{r.name}</Td>
                  <Td>{r.email}</Td>
                  <Td>{r.subject ?? '-'}</Td>
                  <Td muted>{relativeDate(r.created_at)}</Td>
                  <Td>
                    <StatusSelect
                      value={r.status}
                      options={CONTACT_STATUSES as readonly string[]}
                      labels={CONTACT_STATUS_LABEL}
                      onChange={(v) => updateStatus('contact', r.id, v)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Show-pakketten" subtitle={`${disco.length} aanvragen`}>
        {disco.length === 0 ? (
          <Empty />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Naam</Th>
                <Th>Pakket</Th>
                <Th>Datum</Th>
                <Th>Gasten</Th>
                <Th>Locatie</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {disco.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <Td>
                    <div className="font-medium text-[var(--color-fg)]">{r.name}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">{r.email}</div>
                  </Td>
                  <Td>
                    {r.package?.name ? <Badge tone="info">{r.package.name}</Badge> : '-'}
                  </Td>
                  <Td muted>{relativeDate(r.event_date)}</Td>
                  <Td muted>{r.guest_count ?? '-'}</Td>
                  <Td muted>{r.location ?? '-'}</Td>
                  <Td>
                    <StatusSelect
                      value={r.status}
                      options={INQUIRY_STATUSES as readonly string[]}
                      labels={INQUIRY_STATUS_LABEL}
                      onChange={(v) => updateStatus('show-package', r.id, v)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Artiest-boekingen" subtitle={`${artist.length} aanvragen`}>
        {artist.length === 0 ? (
          <Empty />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Naam</Th>
                <Th>Artiest</Th>
                <Th>Datum</Th>
                <Th>Locatie</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {artist.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <Td>
                    <div className="font-medium text-[var(--color-fg)]">{r.name}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">{r.email}</div>
                  </Td>
                  <Td>{r.artist?.stage_name ?? '-'}</Td>
                  <Td muted>{relativeDate(r.event_date)}</Td>
                  <Td muted>{r.event_location ?? '-'}</Td>
                  <Td>
                    <StatusSelect
                      value={r.status}
                      options={INQUIRY_STATUSES as readonly string[]}
                      labels={INQUIRY_STATUS_LABEL}
                      onChange={(v) => updateStatus('artist-booking', r.id, v)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-wide text-[var(--color-fg)]">
          {title}
        </h3>
        {subtitle && <span className="text-xs text-[var(--color-fg-muted)]">{subtitle}</span>}
      </div>
      {children}
    </section>
  )
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  )
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-2 text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">{children}</th>
}
function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td className={`px-4 py-3 ${muted ? 'text-[var(--color-fg-secondary)]' : 'text-[var(--color-fg)]'}`}>
      {children}
    </td>
  )
}
function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-6 text-center text-sm text-[var(--color-fg-muted)]">
      Niets binnen.
    </div>
  )
}
