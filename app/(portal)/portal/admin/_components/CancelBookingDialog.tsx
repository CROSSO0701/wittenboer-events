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
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'

export function CancelBookingDialog({
  bookingId,
  open,
  onOpenChange,
  onCancelled,
}: {
  bookingId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onCancelled: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      if (data.googleDeleted) toast.success('Geannuleerd, agenda-event verwijderd.')
      else if (data.googleError) toast.warning(`Geannuleerd. Agenda-event niet verwijderd: ${data.googleError}`)
      else toast.success('Geannuleerd.')
      onCancelled()
      onOpenChange(false)
      setReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Annuleren faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boeking annuleren</DialogTitle>
          <DialogDescription>
            De artiest en de klant krijgen een mail. Eventueel agenda-event wordt verwijderd.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">Reden (optioneel)</Label>
          <Textarea
            id="cancel-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijv. ziekte, weers­omstandigheden, klant heeft afgezegd..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Toch niet
          </Button>
          <Button variant="danger" onClick={submit} disabled={submitting}>
            {submitting ? 'Annuleren…' : 'Boeking annuleren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
