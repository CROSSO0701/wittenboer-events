'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Speaker, Lightbulb, Mic, Theater, Plug, Send } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'

type FieldErrors = Record<string, string>

const NEEDS = [
  { id: 'geluid', label: 'Geluid', icon: Speaker },
  { id: 'licht', label: 'Licht', icon: Lightbulb },
  { id: 'tape', label: 'Tape (begeleiding op band)', icon: Mic },
  { id: 'podium', label: 'Podium / rigging', icon: Theater },
  { id: 'stroom', label: 'Stroomvoorziening', icon: Plug },
] as const

const GUEST_RANGES = ['1–50', '50–150', '150–500', '500+'] as const

function localToISO(local: string): string | undefined {
  if (!local) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function SubmitBookingForm({
  stageName,
  onSuccess,
}: {
  stageName: string
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [needs, setNeeds] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<FieldErrors>({})

  function toggleNeed(id: string) {
    setNeeds((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const eventDate = (fd.get('event_date') as string)?.trim()
    const eventLocation = (fd.get('event_location') as string)?.trim()
    const guestRange = fd.get('guest_count') as string
    const organiserName = (fd.get('organiser_name') as string)?.trim()
    const organiserPhone = (fd.get('organiser_phone') as string)?.trim()
    const note = (fd.get('note') as string)?.trim()

    if (!eventDate || !eventLocation) {
      setErrors({
        event_date: !eventDate ? 'Vul de datum in.' : '',
        event_location: !eventLocation ? 'Vul de locatie in.' : '',
      })
      setSubmitting(false)
      return
    }

    const needsLabels = Array.from(needs)
      .map((id) => NEEDS.find((n) => n.id === id)?.label)
      .filter(Boolean)

    const compiledNotes = [
      needsLabels.length > 0 && `Nodig: ${needsLabels.join(' · ')}`,
      guestRange && `Gasten (geschat): ${guestRange}`,
      organiserName && `Contact organisator: ${organiserName}${organiserPhone ? ` (${organiserPhone})` : ''}`,
      note && `Bericht: ${note}`,
    ]
      .filter(Boolean)
      .join('\n')

    const body = {
      client_name: `Show: ${stageName} @ ${eventLocation}`,
      client_phone: organiserPhone || undefined,
      event_date: eventDate,
      event_start: localToISO((fd.get('event_start') as string) || ''),
      event_end: localToISO((fd.get('event_end') as string) || ''),
      event_location: eventLocation,
      notes: compiledNotes || undefined,
    }

    try {
      const res = await fetch('/api/portal/artist/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.issues) {
          const next: FieldErrors = {}
          for (const issue of data.issues as Array<{ path: string[]; message: string }>) {
            next[issue.path[0]!] = issue.message
          }
          setErrors(next)
        }
        toast.error(data.error ?? `Versturen faalde (${res.status})`)
        return
      }
      toast.success('Aanvraag verstuurd. Marnix neemt binnen 1 werkdag contact op.')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Versturen faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field
        label="Datum show *"
        name="event_date"
        type="date"
        required
        error={errors.event_date}
        className="sm:col-span-2"
      />
      <Field label="Aanvangstijd" name="event_start" type="datetime-local" error={errors.event_start} />
      <Field label="Eindtijd" name="event_end" type="datetime-local" error={errors.event_end} />
      <Field
        label="Locatie *"
        name="event_location"
        required
        error={errors.event_location}
        placeholder="Bijv. Café De Hoek, Eindhoven"
        className="sm:col-span-2"
      />

      <div className="sm:col-span-2 flex flex-col gap-2">
        <Label>Wat heb je nodig?</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NEEDS.map((n) => {
            const Icon = n.icon
            const checked = needs.has(n.id)
            return (
              <button
                type="button"
                key={n.id}
                onClick={() => toggleNeed(n.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                    : 'border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <Icon size={16} className="shrink-0" /> {n.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="guest_count">Aantal bezoekers (geschat)</Label>
        <select
          id="guest_count"
          name="guest_count"
          className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
          defaultValue=""
        >
          <option value="">— kies —</option>
          {GUEST_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block" />

      <Field
        label="Naam organisator (optioneel)"
        name="organiser_name"
        placeholder="Wie is jouw contact bij de gig?"
      />
      <Field label="Telefoon organisator (optioneel)" name="organiser_phone" type="tel" />

      <div className="sm:col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="note">Bijzonderheden</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Wat wil je dat Marnix weet? Setlist, podiummaat, decoratie, enz."
        />
      </div>

      <div className="sm:col-span-2 mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-fg-muted)]">
          Marnix krijgt direct een mail. Reactie binnen 1 werkdag.
        </p>
        <Button type="submit" disabled={submitting}>
          <Send size={14} /> {submitting ? 'Versturen…' : 'Verzenden naar Marnix'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  error,
  className,
  ...rest
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  error?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} {...rest} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
