'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, UserPlus, Pencil, Ban } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { AcceptDialog } from './AcceptDialog'
import { DeclineDialog } from './DeclineDialog'
import { AssignStaffDialog } from './AssignStaffDialog'
import { EditBookingDialog } from './EditBookingDialog'
import { CancelBookingDialog } from './CancelBookingDialog'
import { BookingNotes } from './BookingNotes'
import { StatusBadge } from '../../_components/StatusBadge'
import { formatEUR, sourceLabel } from '../../../../lib/format'
import type { Database } from '../../../../lib/db/types.generated'

type Booking = Database['public']['Tables']['bookings']['Row']

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'full' }).format(new Date(d))
}

type Row = Booking & { artist?: { stage_name: string | null } | null }

export function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
  onChanged,
}: {
  booking: Row | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onChanged: () => void
}) {
  const router = useRouter()
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setAcceptOpen(false)
      setDeclineOpen(false)
      setAssignOpen(false)
      setEditOpen(false)
      setCancelOpen(false)
    }
  }, [open])

  if (!booking) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent wide>
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
              <span className="uppercase tracking-wider">Aangevraagd door</span>
              <Badge tone="info">{sourceLabel(booking.source)}</Badge>
              <span className="opacity-50">·</span>
              <StatusBadge status={booking.status} />
            </div>
            <DialogTitle>
              {booking.client_name ?? '(geen klantnaam)'}
              {booking.artist?.stage_name && (
                <span className="text-[var(--color-fg-muted)]"> · {booking.artist.stage_name}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              Bekijk de details en accepteer, wijs af of plan crew in.
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DetailRow label="Datum" value={formatDate(booking.event_date)} />
            <DetailRow label="Locatie" value={booking.event_location ?? '—'} />
            <DetailRow label="Aanvang" value={booking.event_start ? new Date(booking.event_start).toLocaleString('nl-NL') : '—'} />
            <DetailRow label="Einde" value={booking.event_end ? new Date(booking.event_end).toLocaleString('nl-NL') : '—'} />
            <DetailRow
              label={booking.source === 'artist' ? 'Organisator e-mail' : 'Klant e-mail'}
              value={booking.client_email ?? '—'}
            />
            <DetailRow
              label={booking.source === 'artist' ? 'Organisator telefoon' : 'Klant telefoon'}
              value={booking.client_phone ?? '—'}
            />
            <DetailRow label="Gage" value={formatEUR(booking.fee_cents)} />
            <DetailRow label="Aangemaakt" value={new Date(booking.created_at).toLocaleString('nl-NL')} />
          </dl>

          {booking.client_id && (
            <a
              href={`/portal/admin/klanten/${booking.client_id}`}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Bekijk klantprofiel →
            </a>
          )}

          {booking.notes && (
            <div className="rounded-xl bg-[var(--color-surface-1)] p-4 text-sm text-[var(--color-fg)]">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">Notities</div>
              <p className="whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {booking.status === 'declined' && booking.decline_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <div className="mb-1 text-[11px] uppercase tracking-wider">Reden afwijzing</div>
              <p className="whitespace-pre-wrap">{booking.decline_reason}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {booking.status === 'pending' && (
              <>
                <Button onClick={() => setAcceptOpen(true)}>
                  <Check size={16} /> Accepteren
                </Button>
                <Button variant="ghost" onClick={() => setDeclineOpen(true)}>
                  <X size={16} /> Afwijzen
                </Button>
              </>
            )}
            {booking.status === 'accepted' && (
              <>
                <Button variant="subtle" onClick={() => setAssignOpen(true)}>
                  <UserPlus size={16} /> Personeel toewijzen
                </Button>
                <Button variant="ghost" onClick={() => setEditOpen(true)}>
                  <Pencil size={16} /> Bewerken
                </Button>
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <Ban size={16} /> Annuleren
                </Button>
              </>
            )}
          </div>

          <BookingNotes bookingId={booking.id} />
        </DialogContent>
      </Dialog>

      <EditBookingDialog
        booking={booking}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => {
          onChanged()
        }}
      />
      <CancelBookingDialog
        bookingId={booking.id}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancelled={() => {
          onChanged()
        }}
      />

      <AcceptDialog
        bookingId={booking.id}
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        onAccepted={({ googleEventId, googleError, staffAssigned, staffNames }) => {
          // Bouw een mensentaal-toast op
          const parts: string[] = ['Geaccepteerd.']
          if (googleEventId) parts.push('In je agenda gezet.')
          if (staffAssigned > 0) {
            const names =
              staffNames.length > 0
                ? staffNames.length === 1
                  ? staffNames[0]
                  : `${staffNames.slice(0, -1).join(', ')} en ${staffNames[staffNames.length - 1]}`
                : `${staffAssigned} crewleden`
            parts.push(`${names} krijgt een berichtje.`)
          }
          const msg = parts.join(' ')

          if (googleError && !googleEventId) {
            const noConfig = /credentials ontbreken|niet geconfigureerd/i.test(googleError)
            toast.warning(
              noConfig
                ? 'Geaccepteerd. Koppel Google Agenda om aanvragen automatisch in je agenda te krijgen.'
                : `Geaccepteerd. Agenda-sync faalde: ${googleError}`,
              {
                action: noConfig
                  ? { label: 'Verbinden', onClick: () => router.push('/portal/admin/integraties') }
                  : undefined,
                duration: 6000,
              }
            )
          } else {
            toast.success(msg)
          }
          onChanged()
        }}
      />
      <DeclineDialog
        bookingId={booking.id}
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        onDeclined={() => {
          toast.success('Klus afgewezen.')
          onChanged()
        }}
      />
      <AssignStaffDialog
        bookingId={booking.id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => {
          toast.success('Personeel toegewezen en geïnformeerd.')
          onChanged()
        }}
      />
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">{label}</dt>
      <dd className="text-[var(--color-fg)]">{value}</dd>
    </div>
  )
}
