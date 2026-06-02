'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Mail, Phone, Calendar, MapPin, Users, Music2, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'
import type { Database } from '../../../../lib/db/types.generated'
import { relativeDate, fmtAgo, CONTACT_STATUS_LABEL, INQUIRY_STATUS_LABEL } from '../../../../lib/format'
import { StatusSelect } from './StatusSelect'

export type InquiryType = 'contact' | 'show-package' | 'artist-booking'

type Detail = {
  name: string
  organisation: string | null
  email: string | null
  phone: string | null
  subject: string | null
  message: string | null
  eventDate: string | null
  location: string | null
  guestCount: number | null
  packageName: string | null
  artistName: string | null
  status: string
  createdAt: string
}

const TYPE_LABEL: Record<InquiryType, string> = {
  contact: 'Contactvraag',
  'show-package': 'Pakketaanvraag',
  'artist-booking': 'Artiest-aanvraag',
}
const CONTACT_STATUSES = ['new', 'replied', 'closed'] as const
const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'closed'] as const

export function InquiryDetailSheet({
  inquiry,
  open,
  onOpenChange,
  onChanged,
}: {
  inquiry: { type: InquiryType; id: string } | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !inquiry) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        let d: Detail | null = null
        if (inquiry.type === 'contact') {
          const { data } = await supabase.from('contact_inquiries').select('*').eq('id', inquiry.id).maybeSingle()
          const r = data as Database['public']['Tables']['contact_inquiries']['Row'] | null
          if (r)
            d = {
              name: r.name,
              organisation: null,
              email: r.email,
              phone: r.phone,
              subject: r.subject,
              message: r.message,
              eventDate: null,
              location: null,
              guestCount: null,
              packageName: null,
              artistName: null,
              status: r.status,
              createdAt: r.created_at,
            }
        } else if (inquiry.type === 'show-package') {
          const { data } = await supabase
            .from('disco_inquiries')
            .select('*, package:disco_packages(name)')
            .eq('id', inquiry.id)
            .maybeSingle()
          const r = data as
            | (Database['public']['Tables']['disco_inquiries']['Row'] & { package?: { name: string } | null })
            | null
          if (r)
            d = {
              name: r.name,
              organisation: r.organisation,
              email: r.email,
              phone: r.phone,
              subject: null,
              message: r.notes,
              eventDate: r.event_date,
              location: r.location,
              guestCount: r.guest_count,
              packageName: r.package?.name ?? null,
              artistName: null,
              status: r.status,
              createdAt: r.created_at,
            }
        } else {
          const { data } = await supabase
            .from('artist_booking_inquiries')
            .select('*, artist:artists(stage_name)')
            .eq('id', inquiry.id)
            .maybeSingle()
          const r = data as
            | (Database['public']['Tables']['artist_booking_inquiries']['Row'] & {
                artist?: { stage_name: string } | null
              })
            | null
          if (r)
            d = {
              name: r.name,
              organisation: r.organisation,
              email: r.email,
              phone: r.phone,
              subject: null,
              message: r.notes,
              eventDate: r.event_date,
              location: r.event_location,
              guestCount: null,
              packageName: null,
              artistName: r.artist?.stage_name ?? null,
              status: r.status,
              createdAt: r.created_at,
            }
        }
        if (!cancelled) setDetail(d)
      } catch {
        if (!cancelled) setDetail(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, inquiry])

  const type = inquiry?.type ?? 'contact'
  const labels = type === 'contact' ? CONTACT_STATUS_LABEL : INQUIRY_STATUS_LABEL
  const statusOptions = type === 'contact' ? CONTACT_STATUSES : INQUIRY_STATUSES

  async function changeStatus(status: string) {
    if (!inquiry) return
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.type}/${inquiry.id}/status`, {
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
      setDetail((cur) => (cur ? { ...cur, status } : cur))
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bijwerken faalde')
    }
  }

  const reSubject = detail?.subject || detail?.packageName || detail?.artistName || 'je aanvraag bij Wittenboer'
  const mailto = detail?.email
    ? `mailto:${detail.email}?subject=${encodeURIComponent('Re: ' + reSubject)}&body=${encodeURIComponent(
        `Hoi ${detail.name?.split(' ')[0] ?? ''},\n\n`
      )}`
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{inquiry ? TYPE_LABEL[inquiry.type] : 'Aanvraag'}</DialogTitle>
          <DialogDescription>
            {detail ? `Binnengekomen ${fmtAgo(detail.createdAt)}` : 'Laden…'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-[var(--color-surface-1)]" />
        ) : !detail ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Kon de aanvraag niet laden.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-medium text-[var(--color-fg)]">
                {detail.name}
                {detail.organisation && (
                  <span className="font-normal text-[var(--color-fg-muted)]"> · {detail.organisation}</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.email && (
                  <a
                    href={mailto}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm text-[var(--color-primary-deep)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    <Mail size={14} /> {detail.email}
                  </a>
                )}
                {detail.phone && (
                  <a
                    href={`tel:${detail.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] px-3 py-1.5 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-primary)]"
                  >
                    <Phone size={14} /> {detail.phone}
                  </a>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {detail.subject && <Field label="Onderwerp" value={detail.subject} />}
              {detail.packageName && <Field label="Pakket" value={detail.packageName} icon={<Package size={13} />} />}
              {detail.artistName && <Field label="Artiest" value={detail.artistName} icon={<Music2 size={13} />} />}
              {detail.eventDate && (
                <Field label="Datum" value={relativeDate(detail.eventDate)} icon={<Calendar size={13} />} />
              )}
              {detail.location && <Field label="Locatie" value={detail.location} icon={<MapPin size={13} />} />}
              {detail.guestCount != null && (
                <Field label="Aantal gasten" value={String(detail.guestCount)} icon={<Users size={13} />} />
              )}
            </dl>

            {detail.message && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                  Bericht
                </div>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-3 text-sm text-[var(--color-fg)]">
                  {detail.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                Status
              </span>
              <StatusSelect value={detail.status} options={statusOptions} labels={labels} onChange={changeStatus} />
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {mailto ? (
            <a
              href={mailto}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <Mail size={15} /> Mail beantwoorden
            </a>
          ) : (
            <span />
          )}
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-[var(--color-fg)]">
        {icon}
        {value}
      </dd>
    </div>
  )
}
