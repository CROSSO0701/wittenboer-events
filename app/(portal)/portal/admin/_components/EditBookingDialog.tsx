'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import type { Database } from '../../../../lib/db/types.generated'

type Booking = Database['public']['Tables']['bookings']['Row']

function localDateTimeFromISO(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  // Convert to local YYYY-MM-DDTHH:MM for datetime-local input
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localToISO(local: string): string | undefined {
  if (!local) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function EditBookingDialog({
  booking,
  open,
  onOpenChange,
  onSaved,
}: {
  booking: Booking
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const feeRaw = (fd.get('fee_eur') as string)?.trim()
    const body = {
      client_name: ((fd.get('client_name') as string) || '').trim() || undefined,
      client_email: ((fd.get('client_email') as string) || '').trim() || undefined,
      client_phone: ((fd.get('client_phone') as string) || '').trim() || undefined,
      event_date: ((fd.get('event_date') as string) || '').trim() || undefined,
      event_start: localToISO((fd.get('event_start') as string) || ''),
      event_end: localToISO((fd.get('event_end') as string) || ''),
      event_location: ((fd.get('event_location') as string) || '').trim() || undefined,
      fee_cents: feeRaw ? Math.round(Number(feeRaw) * 100) : undefined,
      notes: ((fd.get('notes') as string) || '').trim() || undefined,
    }
    try {
      const res = await fetch(`/api/bookings/${booking.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      const sync = data.googleSync as 'patched' | 'skipped' | 'error' | undefined
      if (sync === 'patched') toast.success('Boeking bijgewerkt, agenda gesynchroniseerd.')
      else if (sync === 'error') toast.warning(`Boeking bijgewerkt. Agenda-sync faalde: ${data.googleError ?? 'onbekend'}`)
      else toast.success('Boeking bijgewerkt.')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bijwerken faalde')
    } finally {
      setSubmitting(false)
    }
  }

  const feeEur = booking.fee_cents == null ? '' : (booking.fee_cents / 100).toFixed(2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>Boeking bewerken</DialogTitle>
          <DialogDescription>
            Wijzig datum/tijd, locatie, klantgegevens of notities. Agenda-events worden
            automatisch bijgewerkt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Klantnaam" name="client_name" defaultValue={booking.client_name ?? ''} />
          <Field label="Klant e-mail" name="client_email" type="email" defaultValue={booking.client_email ?? ''} />
          <Field label="Klant telefoon" name="client_phone" type="tel" defaultValue={booking.client_phone ?? ''} />
          <Field label="Datum" name="event_date" type="date" defaultValue={booking.event_date ?? ''} />
          <Field label="Aanvang" name="event_start" type="datetime-local" defaultValue={localDateTimeFromISO(booking.event_start)} />
          <Field label="Einde" name="event_end" type="datetime-local" defaultValue={localDateTimeFromISO(booking.event_end)} />
          <Field label="Locatie" name="event_location" className="sm:col-span-2" defaultValue={booking.event_location ?? ''} />
          <Field label="Gage (EUR)" name="fee_eur" type="number" step="0.01" min="0" defaultValue={feeEur} />
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="notes">Notities</Label>
            <Textarea id="notes" name="notes" defaultValue={booking.notes ?? ''} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Opslaan…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  name,
  type = 'text',
  className,
  ...rest
}: {
  label: string
  name: string
  type?: string
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'>) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} {...rest} />
    </div>
  )
}
