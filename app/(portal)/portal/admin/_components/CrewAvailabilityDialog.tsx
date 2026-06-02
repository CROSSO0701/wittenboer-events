'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
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
import { useStaffList } from './useStaffList'

export type AvailabilityRow = {
  id: string
  staff_id: string
  start_date: string
  end_date: string
  kind: 'vrij' | 'vakantie'
  note: string | null
}

export function CrewAvailabilityDialog({
  availability,
  staffId,
  open,
  onOpenChange,
  onSaved,
}: {
  availability?: AvailabilityRow | null
  staffId?: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!availability
  const { staff } = useStaffList({ enabled: open })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false)
    }
  }, [open])

  const lockedStaff = staffId ?? availability?.staff_id

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const start = ((fd.get('start_date') as string) || '').trim()
    const end = ((fd.get('end_date') as string) || '').trim()
    if (start && end && end < start) {
      toast.error('Einddatum mag niet vóór de startdatum liggen.')
      setSubmitting(false)
      return
    }
    try {
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/admin/availability/${availability!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_date: start || undefined,
            end_date: end || undefined,
            kind: (fd.get('kind') as string) || undefined,
            note: ((fd.get('note') as string) || '').trim() || undefined,
          }),
        })
      } else {
        const chosenStaff = lockedStaff ?? ((fd.get('staff_id') as string) || '')
        if (!chosenStaff) {
          toast.error('Kies een crewlid.')
          setSubmitting(false)
          return
        }
        res = await fetch('/api/admin/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id: chosenStaff,
            start_date: start,
            end_date: end || start,
            kind: (fd.get('kind') as string) || 'vrij',
            note: ((fd.get('note') as string) || '').trim() || undefined,
          }),
        })
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success(isEdit ? 'Periode bijgewerkt.' : 'Vrij/vakantie toegevoegd.')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan faalde')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete() {
    if (!availability) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/availability/${availability.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Periode verwijderd.')
      setConfirmDelete(false)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen faalde')
    } finally {
      setDeleting(false)
    }
  }

  const lockedStaffName = lockedStaff
    ? staff.find((s) => s.id === lockedStaff)?.full_name ?? null
    : null

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Vrij/vakantie bewerken' : 'Vrij/vakantie toevoegen'}</DialogTitle>
          <DialogDescription>
            Markeer een periode waarin een crewlid niet beschikbaar is. De agenda toont dit en
            waarschuwt bij het inplannen op die dagen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {lockedStaff ? (
            <div className="flex flex-col gap-1.5">
              <Label>Crewlid</Label>
              <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2 text-sm text-[var(--color-fg)]">
                {lockedStaffName ?? lockedStaff}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="av-staff">Crewlid</Label>
              <select
                id="av-staff"
                name="staff_id"
                className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Kies een crewlid…
                </option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name ?? s.email ?? s.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="av-start">Van</Label>
              <Input
                id="av-start"
                name="start_date"
                type="date"
                defaultValue={availability?.start_date ?? ''}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="av-end">Tot en met</Label>
              <Input
                id="av-end"
                name="end_date"
                type="date"
                defaultValue={availability?.end_date ?? ''}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="av-kind">Type</Label>
            <select
              id="av-kind"
              name="kind"
              defaultValue={availability?.kind ?? 'vrij'}
              className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
            >
              <option value="vrij">Vrij</option>
              <option value="vakantie">Vakantie</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="av-note">Notitie</Label>
            <Textarea id="av-note" name="note" defaultValue={availability?.note ?? ''} />
          </div>

          <DialogFooter className="sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting || submitting}
              >
                <Trash2 size={14} /> Verwijderen
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                Annuleren
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmDelete} onOpenChange={(o) => !deleting && setConfirmDelete(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Periode verwijderen</DialogTitle>
          <DialogDescription>
            Weet je zeker dat je deze vrij-/vakantieperiode wilt verwijderen? Dit kan niet
            ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
          >
            Toch niet
          </Button>
          <Button type="button" variant="danger" onClick={onDelete} disabled={deleting}>
            <Trash2 size={14} /> {deleting ? 'Verwijderen…' : 'Verwijderen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
