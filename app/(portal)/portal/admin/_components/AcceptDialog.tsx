'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Label } from '../../../../components/ui/label'
import { Input } from '../../../../components/ui/input'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

type Staff = { id: string; full_name: string | null; email: string | null }
type Conflict = { id: string; summary: string; startISO: string; endISO: string }

export function AcceptDialog({
  bookingId,
  open,
  onOpenChange,
  onAccepted,
}: {
  bookingId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onAccepted: (result: {
    googleEventId?: string | null
    googleError?: string | null
    staffAssigned: number
    staffNames: string[]
  }) => void
}) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [picked, setPicked] = useState<Record<string, { role: string; channel: 'email' | 'whatsapp' }>>({})
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
        setStaff(((data as Staff[]) ?? []))
      } catch {
        // RLS may block — okay to leave empty
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
    setSubmitting(true)
    try {
      const body = {
        staff_ids: Object.keys(picked),
        override_overlap: override,
      }
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409 && data.conflicts) {
        setConflicts(data.conflicts as Conflict[])
        toast.warning('Agenda-overlap gevonden. Bekijk en bevestig.')
        return
      }
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      // Optionally assign staff with their roles/channels — alle gekozen mensen
      const pickedIds = Object.keys(picked)
      const assigns = pickedIds.map((id) => ({
        staff_id: id,
        role_on_job: picked[id]!.role || undefined,
        notification_channel: picked[id]!.channel,
      }))
      if (assigns.length > 0) {
        await fetch(`/api/bookings/${bookingId}/assign-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments: assigns }),
        })
      }
      const staffNames = pickedIds
        .map((id) => staff.find((s) => s.id === id)?.full_name ?? null)
        .filter((n): n is string => !!n)
      onAccepted({
        googleEventId: (data as { googleEventId?: string | null }).googleEventId ?? null,
        googleError: (data as { googleError?: string | null }).googleError ?? null,
        staffAssigned: pickedIds.length,
        staffNames,
      })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Accepteren faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>Aanvraag accepteren</DialogTitle>
          <DialogDescription>
            Optioneel: kies wie er gaat rijden. De artiest krijgt automatisch een bevestiging.
          </DialogDescription>
        </DialogHeader>

        {conflicts && conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} /> Agenda-overlap op deze datum
            </div>
            <ul className="space-y-1">
              {conflicts.map((c) => (
                <li key={c.id}>
                  <strong>{c.summary}</strong> · {new Date(c.startISO).toLocaleString('nl-NL')} –{' '}
                  {new Date(c.endISO).toLocaleString('nl-NL')}
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Toch accepteren bij agenda-overlap
            </label>
          </div>
        )}

        {staff.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            Nog geen crewleden toegevoegd. Voeg eerst medewerkers toe via &ldquo;Crew&rdquo;.
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-[var(--color-border)] p-3">
            <Label>Wie gaat er rijden? (optioneel)</Label>
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
                        placeholder="Rol op klus (bv. monitor)"
                        value={picked[s.id]!.role}
                        onChange={(e) =>
                          setPicked((p) => ({ ...p, [s.id]: { ...p[s.id]!, role: e.target.value } }))
                        }
                      />
                      <select
                        className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
                        value={picked[s.id]!.channel}
                        onChange={(e) =>
                          setPicked((p) => ({
                            ...p,
                            [s.id]: { ...p[s.id]!, channel: e.target.value as 'email' | 'whatsapp' },
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
            {submitting ? 'Bezig…' : conflicts && override ? 'Toch accepteren' : 'Accepteren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
