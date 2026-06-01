'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Speaker,
  Lightbulb,
  Mic,
  Theater,
  Plug,
  Send,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  Phone,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'

const NEEDS = [
  { id: 'geluid', label: 'Geluid', icon: Speaker },
  { id: 'licht', label: 'Licht', icon: Lightbulb },
  { id: 'tape', label: 'Tape', sub: 'begeleiding op band', icon: Mic },
  { id: 'podium', label: 'Podium', sub: 'rigging / decor', icon: Theater },
  { id: 'stroom', label: 'Stroom', sub: 'aggregaat / kabels', icon: Plug },
] as const

const QUICK_START_TIMES = ['16:00', '18:00', '19:00', '20:00', '21:00', '22:00'] as const

const DURATION_OPTIONS = [
  { id: '1', label: '1 uur', minutes: 60 },
  { id: '2', label: '2 uur', minutes: 120 },
  { id: '3', label: '3 uur', minutes: 180 },
  { id: 'evening', label: 'Hele avond', minutes: 240 },
] as const

const GUEST_RANGES = [
  { id: '1-50', label: 'Tot 50', sub: 'huiskamer' },
  { id: '50-150', label: '50–150', sub: 'kleine zaal' },
  { id: '150-500', label: '150–500', sub: 'grote zaal' },
  { id: '500+', label: '500+', sub: 'festival' },
] as const

function todayISO(): string {
  const t = new Date()
  const tz = t.getTimezoneOffset() * 60_000
  return new Date(t.getTime() - tz).toISOString().slice(0, 10)
}

function combineToISO(date: string, time: string): string | undefined {
  if (!date || !time) return undefined
  const d = new Date(`${date}T${time}:00`)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes
  const newH = Math.floor((total % 1440) / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function SubmitBookingForm({
  stageName,
  onSuccess,
}: {
  stageName: string
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [durationId, setDurationId] = useState<string | null>(null)
  const [customDuration, setCustomDuration] = useState('')
  const [location, setLocation] = useState('')
  const [needs, setNeeds] = useState<Set<string>>(new Set())
  const [guestRange, setGuestRange] = useState<string>('')
  const [organiserName, setOrganiserName] = useState('')
  const [organiserPhone, setOrganiserPhone] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const minDate = useMemo(() => todayISO(), [])
  const effectiveStart = startTime === 'custom' ? customStart : startTime
  const effectiveDurationMin = useMemo(() => {
    if (durationId === 'custom') return Number(customDuration) * 60 || 0
    return DURATION_OPTIONS.find((d) => d.id === durationId)?.minutes ?? 0
  }, [durationId, customDuration])
  const endTimePreview = useMemo(() => {
    if (!effectiveStart || !effectiveDurationMin) return null
    return addMinutesToTime(effectiveStart, effectiveDurationMin)
  }, [effectiveStart, effectiveDurationMin])

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
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!date) newErrors.event_date = 'Vul de datum in.'
    if (!location.trim()) newErrors.event_location = 'Vul de locatie in.'
    if (startTime === 'custom' && !customStart) newErrors.event_start = 'Vul een tijd in.'
    if (durationId === 'custom') {
      const n = Number(customDuration)
      if (!n || n < 0.5 || n > 12) newErrors.duration = 'Tussen 0.5 en 12 uur.'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Vul de gemarkeerde velden in.')
      return
    }

    setSubmitting(true)

    const eventStartISO = effectiveStart ? combineToISO(date, effectiveStart) : undefined
    const eventEndISO =
      effectiveStart && endTimePreview ? combineToISO(date, endTimePreview) : undefined

    const needsLabels = Array.from(needs)
      .map((id) => NEEDS.find((n) => n.id === id)?.label)
      .filter(Boolean)

    const compiledNotes = [
      needsLabels.length > 0 && `Nodig: ${needsLabels.join(' · ')}`,
      guestRange && `Gasten (geschat): ${GUEST_RANGES.find((g) => g.id === guestRange)?.label ?? guestRange}`,
      !eventStartISO && 'Tijd: nog niet bekend',
      organiserName &&
        `Contact organisator: ${organiserName}${organiserPhone ? ` (${organiserPhone})` : ''}`,
      note && `Bericht: ${note}`,
    ]
      .filter(Boolean)
      .join('\n')

    const body = {
      client_name: `Show: ${stageName} @ ${location}`,
      client_phone: organiserPhone || undefined,
      event_date: date,
      event_start: eventStartISO,
      event_end: eventEndISO,
      event_location: location,
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
          const next: Record<string, string> = {}
          for (const issue of data.issues as Array<{ path: string[]; message: string }>) {
            next[issue.path[0]!] = issue.message
          }
          setErrors(next)
        }
        toast.error(data.error ?? `Versturen faalde (${res.status})`)
        return
      }
      toast.success('Aanvraag verstuurd! Marnix neemt binnen 1 werkdag contact op.', {
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
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
      {/* Sectie: Wanneer */}
      <Section icon={<CalendarIcon size={18} />} title="Wanneer is de show?">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_date" className="text-[var(--color-fg)]">
            Datum
          </Label>
          <Input
            id="event_date"
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
            aria-invalid={!!errors.event_date}
          />
          {errors.event_date && <p className="text-xs text-red-600">{errors.event_date}</p>}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Label className="text-[var(--color-fg)]">Hoe laat begint het?</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {QUICK_START_TIMES.map((t) => (
              <ChipButton
                key={t}
                active={startTime === t}
                onClick={() => {
                  setStartTime(t)
                  setCustomStart('')
                }}
              >
                {t}
              </ChipButton>
            ))}
            <ChipButton
              active={startTime === 'custom'}
              onClick={() => setStartTime('custom')}
            >
              Anders…
            </ChipButton>
            <ChipButton
              active={startTime === ''}
              onClick={() => {
                setStartTime('')
                setCustomStart('')
              }}
              variant="muted"
            >
              Weet ik nog niet
            </ChipButton>
          </div>
          {startTime === 'custom' && (
            <Input
              type="time"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="mt-1 h-12 text-base"
              style={{ fontSize: '16px' }}
              placeholder="bv. 20:30"
            />
          )}
          {errors.event_start && <p className="text-xs text-red-600">{errors.event_start}</p>}
        </div>

        {effectiveStart && (
          <div className="mt-4 flex flex-col gap-2">
            <Label className="text-[var(--color-fg)]">Hoe lang duurt &apos;t?</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {DURATION_OPTIONS.map((d) => (
                <ChipButton
                  key={d.id}
                  active={durationId === d.id}
                  onClick={() => {
                    setDurationId(d.id)
                    setCustomDuration('')
                  }}
                >
                  {d.label}
                </ChipButton>
              ))}
              <ChipButton
                active={durationId === 'custom'}
                onClick={() => setDurationId('custom')}
              >
                Anders…
              </ChipButton>
            </div>
            {durationId === 'custom' && (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  min={0.5}
                  max={12}
                  step={0.5}
                  className="h-12 w-32 text-base"
                  style={{ fontSize: '16px' }}
                  placeholder="3.5"
                />
                <span className="text-sm text-[var(--color-fg-muted)]">uur</span>
              </div>
            )}
            {errors.duration && <p className="text-xs text-red-600">{errors.duration}</p>}
            {endTimePreview && durationId && durationId !== 'custom' && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
                <Clock size={12} /> Eindigt rond {endTimePreview}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Sectie: Waar */}
      <Section icon={<MapPin size={18} />} title="Waar speelt het?">
        <div className="flex flex-col gap-1.5">
          <Input
            id="event_location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bv. Café De Hoek, Eindhoven"
            required
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
            aria-invalid={!!errors.event_location}
          />
          {errors.event_location && (
            <p className="text-xs text-red-600">{errors.event_location}</p>
          )}
          <p className="text-xs text-[var(--color-fg-muted)]">
            Naam van de zaal/café/locatie + plaats.
          </p>
        </div>
      </Section>

      {/* Sectie: Wat heb je nodig */}
      <Section icon={<Speaker size={18} />} title="Wat heb je nodig?" optional>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NEEDS.map((n) => {
            const Icon = n.icon
            const checked = needs.has(n.id)
            return (
              <button
                type="button"
                key={n.id}
                onClick={() => toggleNeed(n.id)}
                className={`flex min-h-[60px] flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  checked
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-fg)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="shrink-0" />
                  <span className="text-sm font-medium">{n.label}</span>
                </div>
                {'sub' in n && n.sub && (
                  <span className="text-[11px] text-[var(--color-fg-muted)]">{n.sub}</span>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Sectie: Hoeveel mensen */}
      <Section icon={<Users size={18} />} title="Hoeveel bezoekers verwacht je?" optional>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GUEST_RANGES.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => setGuestRange(guestRange === g.id ? '' : g.id)}
              className={`flex min-h-[60px] flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                guestRange === g.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-fg)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              <span className="text-sm font-semibold">{g.label}</span>
              <span className="text-[11px] text-[var(--color-fg-muted)]">{g.sub}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Sectie: Organisator + bericht */}
      <Section icon={<MessageSquare size={18} />} title="Iets erbij?" optional>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="organiser_name" className="flex items-center gap-1.5 text-xs">
              <UserIcon size={12} /> Contactpersoon
            </Label>
            <Input
              id="organiser_name"
              value={organiserName}
              onChange={(e) => setOrganiserName(e.target.value)}
              placeholder="Wie regelt het ter plekke?"
              className="h-12 text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="organiser_phone" className="flex items-center gap-1.5 text-xs">
              <Phone size={12} /> Telefoon
            </Label>
            <Input
              id="organiser_phone"
              type="tel"
              inputMode="tel"
              value={organiserPhone}
              onChange={(e) => setOrganiserPhone(e.target.value)}
              placeholder="06-..."
              className="h-12 text-base"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <Label htmlFor="note" className="text-xs">
            Bijzonderheden
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{ fontSize: '16px' }}
            placeholder="Setlist, podiummaat, decoratie, dieet, taxi, etc."
          />
        </div>
      </Section>

      {/* Submit */}
      <div className="sticky bottom-0 -mx-2 flex flex-col gap-2 border-t border-[var(--color-border)] bg-white/95 px-2 pt-4 pb-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-fg-muted)]">
          Marnix krijgt direct een mail. Reactie binnen 1 werkdag.
        </p>
        <Button type="submit" disabled={submitting} className="h-12 text-base">
          <Send size={16} /> {submitting ? 'Versturen…' : 'Verzenden naar Marnix'}
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

function ChipButton({
  active,
  onClick,
  children,
  variant = 'primary',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'muted'
}) {
  const base =
    'flex min-h-[44px] items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors'
  const activeClass =
    variant === 'muted'
      ? 'border-[var(--color-fg-muted)] bg-[var(--color-surface-1)] text-[var(--color-fg)]'
      : 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
  const inactiveClass =
    'border-[var(--color-border)] bg-white text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeClass : inactiveClass}`}
    >
      {children}
    </button>
  )
}
