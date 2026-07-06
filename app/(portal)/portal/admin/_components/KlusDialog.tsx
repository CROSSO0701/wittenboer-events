'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Settings2, Trash2 } from 'lucide-react'
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
import { KlusTypesManager } from './KlusTypesManager'
import { LocationInput } from '../../../../components/shared/LocationInput'

export type KlusRow = {
  id: string
  title: string
  kind: string
  event_date: string
  event_start: string | null
  event_end: string | null
  location: string | null
  notes: string | null
  booking_id: string | null
}

type KlusType = { id: string; label: string }

type Staff = { id: string; full_name: string | null; email: string | null }
type Pick = { role: string; channel: 'email' | 'whatsapp' }
type Conflict = { kind: 'artist' | 'staff' | 'unavailable' | 'klus'; label: string; detail: string }

const CONFLICT_ICON: Record<Conflict['kind'], string> = {
  artist: '🎤',
  staff: '📅',
  klus: '🔧',
  unavailable: '🌴',
}

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
  const [kindOptions, setKindOptions] = useState<KlusType[]>([])
  const [kind, setKind] = useState(klus?.kind ?? '')
  const [typesOpen, setTypesOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Inline nieuw type toevoegen bij het veld zelf.
  const [addingType, setAddingType] = useState(false)
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [savingType, setSavingType] = useState(false)
  // Vrije omschrijving als het gekozen type exact "Overig" is.
  const [overigOmschrijving, setOverigOmschrijving] = useState('')

  // Sentinel-waarde voor de extra optie onderaan de dropdown.
  const NEW_TYPE_SENTINEL = '__new__'

  // Active klus-types laden (voor de dropdown). Apart van de open-effect zodat
  // we ook na het sluiten van de beheer-dialog kunnen verversen.
  async function loadKindOptions() {
    try {
      const res = await fetch('/api/admin/klus-types', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const opts = ((data.types as KlusType[]) ?? []).map((t) => ({ id: t.id, label: t.label }))
      setKindOptions(opts)
      // Zet een geldige default als er nog niets gekozen is.
      setKind((cur) => {
        if (cur && opts.some((o) => o.label === cur)) return cur
        if (cur && !opts.length) return cur
        return opts[0]?.label ?? cur
      })
    } catch {
      setKindOptions([])
    }
  }

  useEffect(() => {
    if (!open) {
      setConflicts(null)
      setOverride(false)
      setPicked({})
      setConfirmDelete(false)
      setAddingType(false)
      setNewTypeLabel('')
      setOverigOmschrijving('')
      return
    }
    setKind(klus?.kind ?? '')
    setAddingType(false)
    setNewTypeLabel('')
    setOverigOmschrijving('')
    loadKindOptions()
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

  // Reageert op de dropdown. De sentinel-optie start de inline invoer en
  // wordt nooit als echte kind-waarde bewaard.
  function onKindSelectChange(value: string) {
    if (value === NEW_TYPE_SENTINEL) {
      setAddingType(true)
      setNewTypeLabel('')
      setOverigOmschrijving('')
      return
    }
    setAddingType(false)
    setNewTypeLabel('')
    // Reset de vrije omschrijving zodra we van "Overig" wegnavigeren.
    if (value !== 'Overig') setOverigOmschrijving('')
    setKind(value)
  }

  function cancelNewType() {
    setAddingType(false)
    setNewTypeLabel('')
  }

  // Nieuw type opslaan via de API en direct selecteren.
  async function submitNewType() {
    const label = newTypeLabel.trim()
    if (!label || savingType) return
    setSavingType(true)
    try {
      const res = await fetch('/api/admin/klus-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409) {
        // Type bestond al: selecteer het gewoon.
        setKind(label)
        setAddingType(false)
        setNewTypeLabel('')
        toast.info('Dit type bestond al en is geselecteerd.')
        return
      }
      if (!res.ok || !data.ok || !data.type) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      const type = data.type as KlusType
      setKindOptions((prev) => [...prev, { id: type.id, label: type.label }])
      setKind(type.label)
      setAddingType(false)
      setNewTypeLabel('')
      toast.success('Type toegevoegd.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Type toevoegen faalde')
    } finally {
      setSavingType(false)
    }
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
    // Bij "Overig" mag de gebruiker een eigen omschrijving meesturen; die
    // wordt geen herbruikbaar type. Anders de gekozen waarde gebruiken.
    const finalKind =
      kind === 'Overig' && overigOmschrijving.trim() ? overigOmschrijving.trim() : kind
    const body = {
      title: ((fd.get('title') as string) || '').trim() || undefined,
      kind: finalKind.trim() || undefined,
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
        toast.warning('Mogelijke dubbelboeking, controleer en bevestig.')
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
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
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
    <>
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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="klus-kind">Type</Label>
              <button
                type="button"
                onClick={() => setTypesOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
              >
                <Settings2 size={13} aria-hidden /> Types beheren
              </button>
            </div>
            <select
              id="klus-kind"
              name="kind"
              value={addingType ? NEW_TYPE_SENTINEL : kind}
              onChange={(e) => onKindSelectChange(e.target.value)}
              className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
            >
              {/* Toon de huidige waarde ook als ze (nog) niet in de active-lijst zit,
                  bv. een type dat later verwijderd is maar nog op deze klus staat. */}
              {kind && !kindOptions.some((o) => o.label === kind) && (
                <option value={kind}>{kind}</option>
              )}
              {kindOptions.length === 0 && !kind && (
                <option value="" disabled>
                  Geen types, voeg er een toe
                </option>
              )}
              {kindOptions.map((o) => (
                <option key={o.id} value={o.label}>
                  {o.label}
                </option>
              ))}
              <option value={NEW_TYPE_SENTINEL}>+ Nieuw type toevoegen…</option>
            </select>
            {addingType && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  autoFocus
                  placeholder="Naam van het type"
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitNewType()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={submitNewType}
                    disabled={!newTypeLabel.trim() || savingType}
                  >
                    {savingType ? 'Toevoegen…' : 'Toevoegen'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={cancelNewType} disabled={savingType}>
                    Annuleren
                  </Button>
                </div>
              </div>
            )}
            {!addingType && kind === 'Overig' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="klus-overig">Eigen omschrijving (optioneel)</Label>
                <Input
                  id="klus-overig"
                  placeholder="Eigen omschrijving (optioneel)"
                  value={overigOmschrijving}
                  onChange={(e) => setOverigOmschrijving(e.target.value)}
                />
              </div>
            )}
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
            <LocationInput
              id="klus-location"
              name="location"
              defaultValue={klus?.location ?? ''}
              placeholder="Adres, stad of venue"
              className="flex h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-fg)] shadow-xs placeholder:text-[var(--color-fg-muted)] focus-visible:outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            />
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
              <Button
                type="button"
                variant={confirmDelete ? 'danger' : 'ghost'}
                onClick={onDelete}
                disabled={deleting || submitting}
              >
                <Trash2 size={14} />{' '}
                {deleting ? 'Verwijderen…' : confirmDelete ? 'Echt verwijderen?' : 'Verwijderen'}
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

    <KlusTypesManager
      open={typesOpen}
      onOpenChange={setTypesOpen}
      onChanged={loadKindOptions}
    />
    </>
  )
}
