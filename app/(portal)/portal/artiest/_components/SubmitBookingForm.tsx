'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Send,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Wrench,
  Building2,
  Route,
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { LocationInput } from '../../../../components/shared/LocationInput'

type SetupType = '' | 'prikken' | 'opbouwen'
type FloorLevel = '' | 'begane_grond' | 'verdieping'
type PavedPath = '' | 'ja' | 'nee'

export function SubmitBookingForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  // Kernvelden in state, zodat we live kunnen valideren en de verzendknop
  // disabled houden tot alles compleet is. Exact dezelfde set als het publieke
  // /klus-doorgeven, maar zonder artiestennaam (die komt uit de login).
  const [event, setEvent] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [setupType, setSetupType] = useState<SetupType>('')
  const [floorLevel, setFloorLevel] = useState<FloorLevel>('')
  const [pavedPath, setPavedPath] = useState<PavedPath>('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Kernvelden verplicht: evenement, datum, showtijden (begin + eind), locatie,
  // telefoon contactpersoon en prikken-of-opbouwen. Zonder deze mag het niet
  // verzonden worden. Gelijk aan het publieke formulier.
  const isComplete = useMemo(
    () =>
      event.trim().length > 0 &&
      eventDate.trim().length > 0 &&
      startTime.trim().length > 0 &&
      endTime.trim().length > 0 &&
      location.trim().length > 0 &&
      clientPhone.trim().length > 0 &&
      (setupType === 'prikken' || setupType === 'opbouwen') &&
      (floorLevel === 'begane_grond' || floorLevel === 'verdieping') &&
      (pavedPath === 'ja' || pavedPath === 'nee'),
    [event, eventDate, startTime, endTime, location, clientPhone, setupType, floorLevel, pavedPath]
  )

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    if (!isComplete) {
      setErrors({ form: 'Vul eerst alle verplichte velden in.' })
      toast.error('Vul de verplichte velden in.')
      return
    }

    setSubmitting(true)

    // Showtijden (begin + eind) naar ISO-datetime, gekoppeld aan de datum. Loopt
    // het optreden door na middernacht? Dan schuift het eind een dag op.
    let eventStartISO: string | undefined
    const startD = new Date(`${eventDate}T${startTime}`)
    if (!Number.isNaN(startD.getTime())) eventStartISO = startD.toISOString()

    let eventEndISO: string | undefined
    const endD = new Date(`${eventDate}T${endTime}`)
    if (!Number.isNaN(endD.getTime())) {
      if (eventStartISO && endD.toISOString() <= eventStartISO) endD.setDate(endD.getDate() + 1)
      eventEndISO = endD.toISOString()
    }

    const body = {
      event,
      client_phone: clientPhone,
      event_date: eventDate,
      event_start: eventStartISO,
      event_end: eventEndISO,
      event_location: location,
      setup_type: setupType,
      floor_level: floorLevel || undefined,
      paved_path: pavedPath === '' ? undefined : pavedPath === 'ja',
      notes,
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
          const next: Record<string, string> = {}
          for (const issue of data.issues as Array<{ path: string[]; message: string }>) {
            next[issue.path[0]!] = issue.message
          }
          setErrors(next)
        }
        toast.error(data.error ?? `Versturen faalde (${res.status})`)
        return
      }
      toast.success('Aanvraag verstuurd. We nemen binnen 1 werkdag contact op.', {
        duration: 6000,
      })
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Versturen faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7" noValidate>
      {/* Sectie: Voor wie */}
      <Section icon={<MessageSquare size={18} />} title="Voor wie / welk evenement?">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event" className="text-[var(--color-fg)]">
            Voor wie / welk evenement?
          </Label>
          <Input
            id="event"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="Bijv. Bruiloft Jansen, Kermis Oss, Café De Kroeg"
            required
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
            aria-invalid={!!errors.event}
          />
          {errors.event && <p className="text-xs text-red-600">{errors.event}</p>}
        </div>
      </Section>

      {/* Sectie: Wanneer */}
      <Section icon={<CalendarIcon size={18} />} title="Wanneer is de show?">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_date" className="text-[var(--color-fg)]">
            Datum
          </Label>
          <Input
            id="event_date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
            aria-invalid={!!errors.event_date}
          />
          {errors.event_date && <p className="text-xs text-red-600">{errors.event_date}</p>}
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5 text-[var(--color-fg)]">
            <Clock size={14} /> Showtijden
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="event_start_time" className="text-xs text-[var(--color-fg-muted)]">
                Begin
              </Label>
              <Input
                id="event_start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="h-12 text-base"
                style={{ fontSize: '16px' }}
                aria-invalid={!!errors.event_start}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="event_end_time" className="text-xs text-[var(--color-fg-muted)]">
                Eind
              </Label>
              <Input
                id="event_end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="h-12 text-base"
                style={{ fontSize: '16px' }}
                aria-invalid={!!errors.event_end}
              />
            </div>
          </div>
          {(errors.event_start || errors.event_end) && (
            <p className="text-xs text-red-600">{errors.event_start ?? errors.event_end}</p>
          )}
        </div>
      </Section>

      {/* Sectie: Waar */}
      <Section icon={<MapPin size={18} />} title="Waar speelt het?">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_location" className="text-[var(--color-fg)]">
            Locatie
          </Label>
          <LocationInput
            id="event_location"
            name="event_location"
            placeholder="Adres / stad / venue"
            defaultValue={location}
            onValueChange={setLocation}
            required
            className="flex h-12 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-base text-[var(--color-fg)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
          />
          {errors.event_location && (
            <p className="text-xs text-red-600">{errors.event_location}</p>
          )}
        </div>
      </Section>

      {/* Sectie: Contactpersoon */}
      <Section icon={<Phone size={18} />} title="Telefoon contactpersoon (klant)">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client_phone" className="text-[var(--color-fg)]">
            Telefoon contactpersoon (klant)
          </Label>
          <Input
            id="client_phone"
            type="tel"
            inputMode="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Telefoonnummer van de contactpersoon"
            required
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
            aria-invalid={!!errors.client_phone}
          />
          {errors.client_phone && <p className="text-xs text-red-600">{errors.client_phone}</p>}
        </div>
      </Section>

      {/* Sectie: Opbouw en toegankelijkheid */}
      <Section icon={<Wrench size={18} />} title="Opbouw en toegankelijkheid">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup_type" className="text-[var(--color-fg)]">
            Prikken of opbouwen?
          </Label>
          <select
            id="setup_type"
            value={setupType}
            onChange={(e) => setSetupType(e.target.value as SetupType)}
            required
            aria-invalid={!!errors.setup_type}
            className="h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base text-[var(--color-fg)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
            style={{ fontSize: '16px' }}
          >
            <option value="" disabled>
              Maak een keuze
            </option>
            <option value="prikken">Prikken</option>
            <option value="opbouwen">Opbouwen</option>
          </select>
          {errors.setup_type && <p className="text-xs text-red-600">{errors.setup_type}</p>}
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="floor_level" className="flex items-center gap-1.5 text-[var(--color-fg)]">
            <Building2 size={14} /> Begane grond of verdieping?
          </Label>
          <select
            id="floor_level"
            value={floorLevel}
            onChange={(e) => setFloorLevel(e.target.value as FloorLevel)}
            className="h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base text-[var(--color-fg)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
            style={{ fontSize: '16px' }}
          >
            <option value="">Maak een keuze</option>
            <option value="begane_grond">Begane grond</option>
            <option value="verdieping">Verdieping</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="paved_path" className="flex items-center gap-1.5 text-[var(--color-fg)]">
            <Route size={14} /> Is er een verhard pad naar het optreden?
          </Label>
          <select
            id="paved_path"
            value={pavedPath}
            onChange={(e) => setPavedPath(e.target.value as PavedPath)}
            className="h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base text-[var(--color-fg)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]"
            style={{ fontSize: '16px' }}
          >
            <option value="">Maak een keuze</option>
            <option value="ja">Ja</option>
            <option value="nee">Nee</option>
          </select>
          <p className="text-xs text-[var(--color-fg-muted)]">Geen grind, gras of zand.</p>
        </div>
      </Section>

      {/* Sectie: Bijzonderheden */}
      <Section icon={<MessageSquare size={18} />} title="Bijzonderheden" optional>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes" className="text-xs">
            Bijzonderheden
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ fontSize: '16px' }}
            placeholder="Bijv. line-up, boel inprikken op aanwezige installatie, wensen of aandachtspunten…"
          />
        </div>
      </Section>

      {/* Submit */}
      <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-fg-muted)]">
          We ontvangen je aanvraag direct. Reactie binnen 1 werkdag.
        </p>
        <Button type="submit" disabled={submitting || !isComplete} className="h-12 text-base">
          <Send size={16} /> {submitting ? 'Versturen…' : 'Aanvraag versturen'}
        </Button>
      </div>
    </form>
  )
}

function Section({
  icon,
  title,
  optional,
  children,
}: {
  icon: React.ReactNode
  title: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]">
          {icon}
        </span>
        <h3 className="font-[family-name:var(--font-display)] text-base uppercase tracking-wide text-[var(--color-fg)]">
          {title}
        </h3>
        {optional && (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">
            optioneel
          </span>
        )}
      </header>
      {children}
    </section>
  )
}
