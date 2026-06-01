'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Trash2 } from 'lucide-react'
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
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

export type KlusRow = {
  id: string
  title: string
  kind: 'opbouw' | 'afbreken' | 'ophalen' | 'overig'
  event_date: string
  event_start: string | null
  event_end: string | null
  location: string | null
  notes: string | null
  booking_id: string | null
}

type Staff = { id: string; full_name: string | null; email: string | null }
type Pick = { role: string; channel: 'email' | 'whatsapp' }
type Conflict = { kind: 'artist' | 'staff' | 'unavailable' | 'klus'; label: string; detail: string }

const CONFLICT_ICON: Record<Conflict['kind'], string> = {
  artist: '🎤',
  staff: '📅',
  klus: '🔧',
  unavailable: '🌴',
}

const KIND_OPTIONS: { value: KlusRow['kind']; label: string }[] = [
  { value: 'opbouw', label: 'Opbouw' },
  { value: 'afbreken', label: 'Afbreken' },
  { value: 'ophalen', label: 'Ophalen' },
  { value: 'overig', label: 'Overig' },
]

function localDateTimeFromISO(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function localToISO(local: string): string | undefined {
  if (!local) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function KlusDialog({
  klus,
  open,
  onOpenChange,
  onSaved,
}: {
  klus?: KlusRow | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const isEdit = !!klus
  const [staff, setStaff] = useState<Staff[]>([])
  const [picked, setPicked] = useState<Record<string, Pick>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)
  const [override, setOverride] = useState(false)

  useEffect(() => {
    if (!open) {
      setConflicts(null)
      setOverride(false)
      setPicked({})
      return
    }
    ;(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: staffRows } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'staff')
          .order('full_name', { ascending: true })
        setStaff((staffRows as Staff[]) ?? [])

        if (klus) {
          const { data: assigns } = await supabase
            .from('klus_assignments')
            .select('staff_id, role_on_job, notification_channel')
            .eq('klus_id', klus.id)
          const next: Record<string, Pick> = {}
          for (const a of assigns ?? []) {
            next[a.staff_id] = {
              role: a.role_on_job ?? '',
              channel: a.notification_channel === 'whatsapp' ? 'whatsapp' : 'email',
            }
          }
          setPicked(next)
        } else {
          setPicked({})
        }
      } catch {
        setStaff([])
      }
    })()
  }, [open, klus])

  function toggle(id: string) {
    setPicked((p) => {
      const next = { ...p }
      if (next[id]) delete next[id]
      else next[id] = { role: '', channel: 'email' }
      return next
    })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const assignments = Object.entries(picked).map(([id, v]) => ({
      staff_id: id,
      role_on_job: v.role || undefined,
      notification_channel: v.channel,
    }))
    const body = {
      title: ((fd.get('title') as string) || '').trim() || undefined,
      kind: (fd.get('kind') as string) || undefined,
      event_date: ((fd.get('event_date') as string) || '').trim() || undefined,
      event_start: localToISO((fd.get('event_start') as string) || ''),
      event_end: localToISO((fd.get('event_end') as string) || ''),
      location: ((fd.get('location') as string) || '').trim() || undefined,
      notes: ((fd.get('notes') as string) || '').trim() || undefined,
      assignments,
      override_overlap: override,
    }
    try {
      const res = await fetch(isEdit ? `/api/admin/klussen/${klus!.id}` : '/api/admin/klussen', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      if (data.assignWarning) toast.warning(`Klus opgeslagen, maar crew toewijzen waarschuwde: ${data.assignWarning}`)
      else toast.success(isEdit ? 'Klus bijgewerkt.' : 'Klus toegevoegd.')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan faalde')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete() {
    if (!klus) return
    if (!window.confirm('Deze klus verwijderen?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/klussen/${klus.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Klus verwijderd.')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen faalde')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Klus bewerken' : 'Klus toevoegen'}</DialogTitle>
          <DialogDescription>
            Logistiek zoals opbouw, afbreken of ophalen. Wijs desgewenst crew toe; zij krijgen een
            mail of WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {conflicts && conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} /> Mogelijke dubbelboeking
            </div>
            <ul className="space-y-1">
              {conflicts.map((c, i) => (
                <li key={i}>
                  <span aria-hidden className="mr-1">{CONFLICT_ICON[c.kind]}</span>
                  <strong>{c.label}</strong>
                  {c.detail ? ` · ${c.detail}` : ''}
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Toch opslaan (dubbelboeking negeren)
            </label>
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="klus-title">Titel</Label>
            <Input id="klus-title" name="title" defaultValue={klus?.title ?? ''} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="klus-kind">Type</Label>
            <select
              id="klus-kind"
              name="kind"
              defaultValue={klus?.kind ?? 'opbouw'}
              className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="klus-date">Datum</Label>
            <Input id="klus-date" name="event_date" type="date" defaultValue={klus?.event_date ?? ''} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="klus-start">Aanvang</Label>
            <Input
              id="klus-start"
              name="event_start"
              type="datetime-local"
              defaultValue={localDateTimeFromISO(klus?.event_start)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="klus-end">Einde</Label>
            <Input
              id="klus-end"
              name="event_end"
              type="datetime-local"
              defaultValue={localDateTimeFromISO(klus?.event_end)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="klus-location">Locatie</Label>
            <Input id="klus-location" name="location" defaultValue={klus?.location ?? ''} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="klus-notes">Notities</Label>
            <Textarea id="klus-notes" name="notes" defaultValue={klus?.notes ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Crew</Label>
            {staff.length === 0 ? (
              <p className="text-sm text-[var(--color-fg-muted)]">Nog geen crewleden toegevoegd.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-auto rounded-xl border border-[var(--color-border)] p-3">
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
                              setPicked((p) => ({ ...p, [s.id]: { ...p[s.id]!, role: e.target.value } }))
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
          </div>

          <DialogFooter className="sm:col-span-2 sm:justify-between">
            {isEdit ? (
              <Button type="button" variant="ghost" onClick={onDelete} disabled={deleting || submitting}>
                <Trash2 size={14} /> {deleting ? 'Verwijderen…' : 'Verwijderen'}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                Annuleren
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Opslaan…' : conflicts && override ? 'Toch opslaan' : 'Opslaan'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
