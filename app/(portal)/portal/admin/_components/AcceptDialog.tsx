'use client'

import { useEffect, useId, useState } from 'react'
import type { ComponentType } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CalendarClock, Music2, Palmtree, Wrench } from 'lucide-react'
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
import { Textarea } from '../../../../components/ui/textarea'
import { useStaffList } from './useStaffList'

type Conflict = { kind: 'artist' | 'staff' | 'unavailable' | 'klus'; label: string; detail: string }

// Lokale "HH:MM" uit een ISO-datetime (met offset). Leeg bij geen/ongeldige waarde.
function localTimeFromISO(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CONFLICT_ICON: Record<Conflict['kind'], ComponentType<{ size?: number; className?: string }>> = {
  artist: Music2,
  staff: CalendarClock,
  klus: Wrench,
  unavailable: Palmtree,
}

export function AcceptDialog({
  bookingId,
  open,
  onOpenChange,
  onAccepted,
  eventDate = null,
  eventStart = null,
  eventEnd = null,
  eventLocation = null,
  notes = null,
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
  eventDate?: string | null
  eventStart?: string | null
  eventEnd?: string | null
  eventLocation?: string | null
  notes?: string | null
}) {
  const fieldId = useId()
  const { staff } = useStaffList({ enabled: open, ordered: false })
  const [picked, setPicked] = useState<Record<string, { role: string; channel: 'email' | 'whatsapp' }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)
  const [override, setOverride] = useState(false)

  // Bewerkbare agenda-velden, voorgevuld uit de huidige booking-waarden.
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      // Voorvullen bij openen zodat wijzigingen aan de booking meekomen.
      setDate(eventDate ?? '')
      setStartTime(localTimeFromISO(eventStart))
      setEndTime(localTimeFromISO(eventEnd))
      setLocation(eventLocation ?? '')
      setDescription(notes ?? '')
    } else {
      setPicked({})
      setConflicts(null)
      setOverride(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Agenda-tijden bouwen uit datum + tijden. Zonder tijd: weglaten zodat de
      // backend een hele-dag-event maakt. Eind <= begin → dag erna.
      let event_start: string | undefined
      let event_end: string | undefined
      if (date && startTime && endTime) {
        const start = new Date(`${date}T${startTime}`)
        let end = new Date(`${date}T${endTime}`)
        if (end.getTime() <= start.getTime()) {
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
        }
        event_start = start.toISOString()
        event_end = end.toISOString()
      }

      const body: {
        staff_ids: string[]
        override_overlap: boolean
        event_date?: string
        event_start?: string
        event_end?: string
        event_location?: string
        notes?: string
      } = {
        staff_ids: Object.keys(picked),
        override_overlap: override,
        event_date: date || undefined,
        event_start,
        event_end,
        event_location: location.trim() || undefined,
        notes: description.trim() || undefined,
      }
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
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
      // Optioneel crew toewijzen met rol/kanaal — alle gekozen mensen
      const pickedIds = Object.keys(picked)
      const assigns = pickedIds.map((id) => ({
        staff_id: id,
        role_on_job: picked[id]!.role || undefined,
        notification_channel: picked[id]!.channel,
      }))
      let staffAssignFailed = false
      if (assigns.length > 0) {
        const assignRes = await fetch(`/api/bookings/${bookingId}/assign-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignments: assigns, override_overlap: override }),
        })
        if (!assignRes.ok) {
          staffAssignFailed = true
          const assignData = await assignRes.json().catch(() => ({}))
          toast.warning(
            assignData.error
              ? `Geaccepteerd, maar crew toewijzen faalde: ${assignData.error}`
              : 'Geaccepteerd, maar crew toewijzen faalde. Plan de crew handmatig in.'
          )
        }
      }
      const staffNames = pickedIds
        .map((id) => staff.find((s) => s.id === id)?.full_name ?? null)
        .filter((n): n is string => !!n)
      onAccepted({
        googleEventId: (data as { googleEventId?: string | null }).googleEventId ?? null,
        googleError: (data as { googleError?: string | null }).googleError ?? null,
        staffAssigned: staffAssignFailed ? 0 : pickedIds.length,
        staffNames: staffAssignFailed ? [] : staffNames,
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
              Toch accepteren (dubbelboeking negeren)
            </label>
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-3">
          <div>
            <Label>Naar Google Agenda</Label>
            <p className="text-xs text-[var(--color-fg-muted)]">Deze tekst komt in de agenda.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-date`}>Datum</Label>
              <Input
                id={`${fieldId}-date`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-start`}>Aanvang</Label>
              <Input
                id={`${fieldId}-start`}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-end`}>Einde</Label>
              <Input
                id={`${fieldId}-end`}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${fieldId}-location`}>Locatie</Label>
            <Input
              id={`${fieldId}-location`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Adres of locatie"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${fieldId}-description`}>Beschrijving</Label>
            <Textarea
              id={`${fieldId}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Beschrijving voor in de agenda"
            />
          </div>
        </div>

        {staff.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            Nog geen crewleden toegevoegd. Voeg eerst crewleden toe via &ldquo;Crew&rdquo;.
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-[var(--color-border)] p-3">
            <Label>Wie gaat er rijden? (optioneel)</Label>
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
                        placeholder="Rol op de boeking (bv. monitor)"
                        value={picked[s.id]!.role}
                        onChange={(e) =>
                          setPicked((p) => ({ ...p, [s.id]: { ...p[s.id]!, role: e.target.value } }))
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
