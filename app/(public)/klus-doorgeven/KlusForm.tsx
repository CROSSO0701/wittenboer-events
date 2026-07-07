'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { LocationInput } from '../../components/shared/LocationInput'

type Status = 'idle' | 'submitting' | 'success' | 'error'
type SetupType = '' | 'prikken' | 'opbouwen'
type FloorLevel = '' | 'begane_grond' | 'verdieping'
type PavedPath = '' | 'ja' | 'nee'

export function KlusForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Kernvelden in state, zodat we live kunnen valideren en de verzendknop
  // disabled houden tot alles compleet is.
  const [artistName, setArtistName] = useState('')
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

  // Kernvelden verplicht: artiest/naam, datum, adres, showtijden (begin + eind),
  // telefoon contactpersoon en prikken-of-opbouwen. Zonder deze mag het niet
  // verzonden worden.
  const isComplete = useMemo(
    () =>
      artistName.trim().length > 0 &&
      event.trim().length > 0 &&
      eventDate.trim().length > 0 &&
      startTime.trim().length > 0 &&
      endTime.trim().length > 0 &&
      location.trim().length > 0 &&
      clientPhone.trim().length > 0 &&
      (setupType === 'prikken' || setupType === 'opbouwen') &&
      (floorLevel === 'begane_grond' || floorLevel === 'verdieping') &&
      (pavedPath === 'ja' || pavedPath === 'nee'),
    [artistName, event, eventDate, startTime, endTime, location, clientPhone, setupType, floorLevel, pavedPath]
  )

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isComplete) {
      setErrorMsg('Vul eerst alle verplichte velden in.')
      setStatus('error')
      return
    }
    setStatus('submitting')
    setErrorMsg(null)

    // Showtijden (begin + eind) naar ISO-datetime, gekoppeld aan de datum.
    let event_start: string | undefined
    const startD = new Date(`${eventDate}T${startTime}`)
    if (!Number.isNaN(startD.getTime())) event_start = startD.toISOString()

    let event_end: string | undefined
    const endD = new Date(`${eventDate}T${endTime}`)
    if (!Number.isNaN(endD.getTime())) {
      // Eindigt het optreden vóór de aanvang? Dan loopt het door na middernacht.
      if (event_start && endD.toISOString() <= event_start) endD.setDate(endD.getDate() + 1)
      event_end = endD.toISOString()
    }

    try {
      const res = await fetch('/api/artist-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_name: artistName,
          event,
          client_phone: clientPhone,
          event_date: eventDate,
          event_start,
          event_end,
          event_location: location,
          setup_type: setupType,
          floor_level: floorLevel || undefined,
          paved_path: pavedPath === '' ? undefined : pavedPath === 'ja',
          notes,
          website: (new FormData(e.currentTarget).get('website') as string) || '',
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'failed')
      }
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : null)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-form">
        <div className="form__success">
          Bedankt, je klus is doorgegeven aan Wittenboer. We bevestigen de details en regelen
          licht, geluid en crew. Voor spoed:{' '}
          <a href="tel:+31627172876" style={{ color: 'inherit', textDecoration: 'underline' }}>
            06 27 17 28 76
          </a>
          .
        </div>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {/* Honeypot, verborgen voor mensen */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <div className="field">
        <label htmlFor="artist_name">Jouw artiestennaam</label>
        <input
          id="artist_name"
          name="artist_name"
          type="text"
          placeholder="Bijv. Mikey Wonder"
          autoComplete="off"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="event">Voor wie / welk evenement?</label>
        <input
          id="event"
          name="event"
          type="text"
          placeholder="Bijv. Bruiloft Jansen, Kermis Oss, Café De Kroeg"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="event_date">Datum</label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label>Showtijden</label>
        <div className="field--row">
          <div className="field">
            <label htmlFor="event_start_time" className="field__sublabel">
              Begin
            </label>
            <input
              id="event_start_time"
              name="event_start_time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="event_end_time" className="field__sublabel">
              Eind
            </label>
            <input
              id="event_end_time"
              name="event_end_time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="event_location">Locatie</label>
        <LocationInput
          id="event_location"
          name="event_location"
          placeholder="Adres / stad / venue"
          defaultValue={location}
          onValueChange={setLocation}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="client_phone">Telefoon contactpersoon (klant)</label>
        <input
          id="client_phone"
          name="client_phone"
          type="tel"
          placeholder="Telefoonnummer van de contactpersoon"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="setup_type">Prikken of opbouwen?</label>
        <select
          id="setup_type"
          name="setup_type"
          value={setupType}
          onChange={(e) => setSetupType(e.target.value as SetupType)}
          required
        >
          <option value="" disabled>
            Maak een keuze
          </option>
          <option value="prikken">Prikken</option>
          <option value="opbouwen">Opbouwen</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="floor_level">Begane grond of verdieping?</label>
        <select
          id="floor_level"
          name="floor_level"
          value={floorLevel}
          onChange={(e) => setFloorLevel(e.target.value as FloorLevel)}
        >
          <option value="">Maak een keuze</option>
          <option value="begane_grond">Begane grond</option>
          <option value="verdieping">Verdieping</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="paved_path">Is er een verhard pad naar het optreden?</label>
        <select
          id="paved_path"
          name="paved_path"
          value={pavedPath}
          onChange={(e) => setPavedPath(e.target.value as PavedPath)}
        >
          <option value="">Maak een keuze</option>
          <option value="ja">Ja</option>
          <option value="nee">Nee</option>
        </select>
        <span className="field__hint">Geen grind, gras of zand.</span>
      </div>

      <div className="field">
        <label htmlFor="notes">Bijzonderheden</label>
        <textarea
          id="notes"
          name="notes"
          placeholder="Bijv. line-up, boel inprikken op aanwezige installatie, wensen of aandachtspunten…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>
          {errorMsg ?? 'Er ging iets mis bij het versturen. Probeer het opnieuw of bel direct.'}
        </p>
      )}

      <div className="form__submit-row">
        <span className="field__hint">Wittenboer bevestigt de details.</span>
        <button
          className="btn-primary"
          type="submit"
          disabled={status === 'submitting' || !isComplete}
        >
          {status === 'submitting' ? 'Versturen…' : 'Klus doorgeven'}
        </button>
      </div>
    </form>
  )
}

export default KlusForm
