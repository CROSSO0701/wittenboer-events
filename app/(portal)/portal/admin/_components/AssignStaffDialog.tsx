'use client'

import { useEffect, useState } from 'react'
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
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

type Staff = { id: string; full_name: string | null; email: string | null }

type Pick = { role: string; channel: 'email' | 'whatsapp' }

export function AssignStaffDialog({
  bookingId,
  open,
  onOpenChange,
  onAssigned,
}: {
  bookingId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onAssigned: () => void
}) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [picked, setPicked] = useState<Record<string, Pick>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setPicked({})
      return
    }
    ;(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'staff')
        setStaff((data as Staff[]) ?? [])
      } catch {
        setStaff([])
      }
    })()
  }, [open])

  function toggle(id: string) {
    setPicked((p) => {
      const next = { ...p }
      if (next[id]) delete next[id]
      else next[id] = { role: '', channel: 'email' }
      return next
    })
  }

  async function submit() {
    const assigns = Object.entries(picked).map(([id, v]) => ({
      staff_id: id,
      role_on_job: v.role || undefined,
      notification_channel: v.channel,
    }))
    if (assigns.length === 0) {
      toast.error('Kies minimaal één persoon.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/assign-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: assigns }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      onAssigned()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Toewijzen faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>Crew inplannen</DialogTitle>
          <DialogDescription>
            De gekozen crewleden krijgen direct een mail of WhatsApp.
          </DialogDescription>
        </DialogHeader>
        {staff.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nog geen crewleden toegevoegd.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-[var(--color-border)] p-3">
            {staff.map((s) => {
              const checked = !!picked[s.id]
              return (
                <div key={s.id} className="rounded-lg border border-[var(--color-border)] p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => toggle(s.id)} />
                    <span className="font-medium">{s.full_name ?? s.email ?? s.id}</span>
                    {s.email && <span className="text-[var(--color-fg-muted)]">· {s.email}</span>}
                  </label>
                  {checked && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Rol op klus"
                        value={picked[s.id]!.role}
                        onChange={(e) =>
                          setPicked((p) => ({
                            ...p,
                            [s.id]: { ...p[s.id]!, role: e.target.value },
                          }))
                        }
                      />
                      <select
                        className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
                        value={picked[s.id]!.channel}
                        onChange={(e) =>
                          setPicked((p) => ({
                            ...p,
                            [s.id]: { ...p[s.id]!, channel: e.target.value as Pick['channel'] },
                          }))
                        }
                      >
                        <option value="email">E-mail</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Bezig…' : 'Toewijzen & informeren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
