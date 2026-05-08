'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          ...Object.fromEntries(data.entries()),
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-form">
        <div className="form__success">
          Bedankt — we nemen binnen één werkdag contact op. Voor spoed:
          {' '}
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
      <div className="field--row">
        <div className="field">
          <label htmlFor="naam">Naam</label>
          <input id="naam" name="naam" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="org">Organisatie</label>
          <input id="org" name="org" type="text" />
        </div>
      </div>
      <div className="field--row">
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="telefoon">Telefoon</label>
          <input id="telefoon" name="telefoon" type="tel" />
        </div>
      </div>
      <div className="field--row">
        <div className="field">
          <label htmlFor="datum">Datum evenement</label>
          <input id="datum" name="datum" type="date" />
        </div>
        <div className="field">
          <label htmlFor="locatie">Locatie</label>
          <input id="locatie" name="locatie" type="text" placeholder="Stad / venue" />
        </div>
      </div>
      <div className="field--row">
        <div className="field">
          <label htmlFor="type">Type evenement</label>
          <select id="type" name="type" defaultValue="Bedrijfsevenement">
            <option>Bedrijfsevenement</option>
            <option>Festival</option>
            <option>Tuinfeest / privé</option>
            <option>Bruiloft</option>
            <option>Beurs / presentatie</option>
            <option>Anders</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="gasten">Aantal gasten (indicatie)</label>
          <select id="gasten" name="gasten" defaultValue="50 – 200">
            <option>&lt; 50</option>
            <option>50 – 200</option>
            <option>200 – 500</option>
            <option>500 – 1500</option>
            <option>1500+</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="bericht">Vertel ons over je evenement</label>
        <textarea
          id="bericht"
          name="bericht"
          placeholder="Wat zoek je? Welke onderdelen? Locatie-bijzonderheden? Hoe meer info, hoe gerichter we kunnen meedenken."
          required
        />
      </div>
      {status === 'error' && (
        <p style={{ color: '#a13a3a', fontSize: 14 }}>
          Er ging iets mis bij het versturen. Probeer het opnieuw of bel direct.
        </p>
      )}
      <div className="form__submit-row">
        <span className="field__hint">We reageren binnen 1 werkdag.</span>
        <button className="btn-primary" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Versturen...' : 'Verstuur aanvraag'}
        </button>
      </div>
    </form>
  )
}

export default ContactForm
