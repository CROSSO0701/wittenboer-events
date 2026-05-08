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

export function DeclineDialog({
  bookingId,
  open,
  onOpenChange,
  onDeclined,
}: {
  bookingId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onDeclined: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!reason.trim()) {
      toast.error('Geef een reden op.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      onDeclined()
      onOpenChange(false)
      setReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Afwijzen faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Klus afwijzen</DialogTitle>
          <DialogDescription>De artiest krijgt jouw reden in de mail.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">Reden van afwijzen</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder="Geen capaciteit op die datum, agenda overlapt met..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={submit} disabled={submitting}>
            {submitting ? 'Bezig…' : 'Afwijzen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
