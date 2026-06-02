'use client'

import { useState, type FormEvent } from 'react'
import { LocationInput } from '../../(portal)/portal/admin/_components/LocationInput'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function KlusForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg(null)
    const data = new FormData(e.currentTarget)

    // Datum + (optionele) tijden naar ISO-datetime voor aanvang/einde.
    const date = (data.get('event_date') as string) || ''
    const startT = (data.get('event_start_time') as string) || ''
    const endT = (data.get('event_end_time') as string) || ''

    let event_start: string | undefined
    if (date && startT) {
      const d = new Date(`${date}T${startT}`)
      if (!Number.isNaN(d.getTime())) event_start = d.toISOString()
    }

    let event_end: string | undefined
    if (date && endT) {
      const d = new Date(`${date}T${endT}`)
      if (!Number.isNaN(d.getTime())) {
        // Eindigt het optreden vóór de aanvang? Dan loopt het door na middernacht.
        if (event_start && d.toISOString() <= event_start) d.setDate(d.getDate() + 1)
        event_end = d.toISOString()
      }
    }

    try {
      const res = await fetch('/api/artist-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_name: data.get('artist_name') || '',
          event: data.get('event') || '',
          client_phone: data.get('client_phone') || '',
          event_date: date,
          event_start,
          event_end,
          event_location: data.get('event_location') || '',
          notes: data.get('notes') || '',
          website: data.get('website') || '',
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
    <form className="contact-form" onSubmit={onSubmit}>
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
          required
        />
      </div>

      <div className="field">
        <label htmlFor="event_date">Datum</label>
        <input id="event_date" name="event_date" type="date" required />
      </div>

      <div className="field--row">
        <div className="field">
          <label htmlFor="event_start_time">Aanvang (optioneel)</label>
          <input id="event_start_time" name="event_start_time" type="time" />
        </div>
        <div className="field">
          <label htmlFor="event_end_time">Einde (optioneel)</label>
          <input id="event_end_time" name="event_end_time" type="time" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="event_location">Locatie</label>
        <LocationInput
          id="event_location"
          name="event_location"
          placeholder="Adres / stad / venue"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="notes">Wat heb je nodig?</label>
        <textarea
          id="notes"
          name="notes"
          placeholder="Bijv. geluid + licht, podium, boel inprikken op aanwezige installatie, line-up, bijzonderheden…"
        />
      </div>

      <div className="field">
        <label htmlFor="client_phone">Je telefoon (optioneel)</label>
        <input id="client_phone" name="client_phone" type="tel" placeholder="Zodat we je snel kunnen bereiken" />
      </div>

      {status === 'error' && (
        <p style={{ color: '#a13a3a', fontSize: 14 }}>
          {errorMsg ?? 'Er ging iets mis bij het versturen. Probeer het opnieuw of bel direct.'}
        </p>
      )}

      <div className="form__submit-row">
        <span className="field__hint">Wittenboer bevestigt de details.</span>
        <button className="btn-primary" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Versturen…' : 'Klus doorgeven'}
        </button>
      </div>
    </form>
  )
}

export default KlusForm
