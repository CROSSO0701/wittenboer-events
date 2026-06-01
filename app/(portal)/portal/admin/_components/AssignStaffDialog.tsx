'use client'

import { useEffect, useId, useState } from 'react'
import type { ComponentType } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CalendarClock, Music2, Palmtree, Wrench } from 'lucide-react'
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
type Conflict = { kind: 'artist' | 'staff' | 'unavailable' | 'klus'; label: string; detail: string }

const CONFLICT_ICON: Record<Conflict['kind'], ComponentType<{ size?: number; className?: string }>> = {
  artist: Music2,
  staff: CalendarClock,
  klus: Wrench,
  unavailable: Palmtree,
}

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
  const fieldId = useId()
  const [staff, setStaff] = useState<Staff[]>([])
  const [picked, setPicked] = useState<Record<string, Pick>>({})
  const [submitting, setSubmitting] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)
  const [override, setOverride] = useState(false)

  useEffect(() => {
    if (!open) {
      setPicked({})
      setConflicts(null)
      setOverride(false)
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
        body: JSON.stringify({ assignments: assigns, override_overlap: override }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409 && data.conflicts) {
        setConflicts(data.conflicts as Conflict[])
        toast.warning('Mogelijke dubbelboeking — controleer en bevestig.')
        return
      }
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
        {conflicts && conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} /> Mogelijke dubbelboeking
            </div>
            <ul className="space-y-1">
              {conflicts.map((c, i) => {
                const Icon = CONFLICT_ICON[c.kind]
                return (
                  <li key={i} className="flex items-center gap-1.5">
                    <Icon size={14} className="shrink-0 text-amber-700" />
                    <span>
                      <strong>{c.label}</strong>
                      {c.detail ? ` · ${c.detail}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Toch toewijzen (dubbelboeking negeren)
            </label>
          </div>
        )}
        {staff.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nog geen crewleden toegevoegd.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-[var(--color-border)] p-3">
            {staff.map((s) => {
              const checked = !!picked[s.id]
              const roleId = `${fieldId}-role-${s.id}`
              const channelId = `${fieldId}-channel-${s.id}`
              return (
                <div key={s.id} className="rounded-lg border border-[var(--color-border)] p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => toggle(s.id)} />
                    <span className="font-medium">{s.full_name ?? s.email ?? s.id}</span>
                    {s.email && <span className="text-[var(--color-fg-muted)]">· {s.email}</span>}
                  </label>
                  {checked && (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        id={roleId}
                        aria-label="Rol op de boeking"
                        placeholder="Rol op de boeking"
                        value={picked[s.id]!.role}
                        onChange={(e) =>
                          setPicked((p) => ({
                            ...p,
                            [s.id]: { ...p[s.id]!, role: e.target.value },
                          }))
                        }
                      />
                      <select
                        id={channelId}
                        aria-label="Notificatie via"
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
            {submitting ? 'Bezig…' : conflicts && override ? 'Toch toewijzen' : 'Toewijzen & informeren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
