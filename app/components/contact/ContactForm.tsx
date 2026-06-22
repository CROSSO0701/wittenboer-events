'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const searchParams = useSearchParams()
  const packageSlug = searchParams.get('pakket')?.trim() || undefined
  const successRef = useRef<HTMLDivElement>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = new FormData(e.currentTarget)
    const get = (key: string) => {
      const v = data.get(key)
      return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined
    }

    // Honeypot — bots vullen dit, mensen niet.
    const website = (data.get('website') as string | null) ?? ''

    // Velden uit het formulier (NL-namen) → schema-namen mappen.
    const naam = get('naam')
    const email = get('email')
    const telefoon = get('telefoon')
    const org = get('org')
    const datum = get('datum')
    const locatie = get('locatie')
    const eventType = get('event_type')
    const gasten = get('gasten')
    const bericht = get('bericht')

    // Body expliciet opbouwen zodat het discriminator-veld (type) nooit
    // overschreven kan worden door een veld uit het formulier.
    let payload: Record<string, unknown>
    if (packageSlug) {
      // Vraag vanaf een showpakket-pagina → show-package-aanvraag.
      payload = {
        name: naam,
        email,
        phone: telefoon,
        organisation: org,
        event_date: datum,
        location: locatie,
        notes: [eventType ? `Type: ${eventType}` : null, gasten ? `Gasten: ${gasten}` : null, bericht]
          .filter(Boolean)
          .join('\n') || undefined,
        package_slug: packageSlug,
        website,
        type: 'show-package',
      }
    } else {
      // Datum/locatie/gasten passen niet in het contact-schema — meenemen in het bericht
      // zodat de aanvraag compleet blijft.
      const context = [
        datum ? `Datum: ${datum}` : null,
        locatie ? `Locatie: ${locatie}` : null,
        gasten ? `Aantal gasten: ${gasten}` : null,
        org ? `Organisatie: ${org}` : null,
      ].filter(Boolean)
      payload = {
        name: naam,
        email,
        phone: telefoon,
        subject: eventType,
        message: context.length > 0 ? `${context.join(' · ')}\n\n${bericht ?? ''}`.trim() : bericht,
        website,
        type: 'contact',
      }
    }

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-form">
        <div className="form__success" role="status" tabIndex={-1} ref={successRef}>
          Bedankt, we nemen binnen één werkdag contact op. Voor spoed:
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
      {/* Honeypot — visueel verborgen, niet zichtbaar voor mensen */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="website">Laat dit veld leeg</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
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
          <label htmlFor="event_type">Type evenement</label>
          <select id="event_type" name="event_type" defaultValue="Bedrijfsevenement">
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
          placeholder="Wat zoek je? Welke onderdelen? Locatie-bijzonderheden? Hoe meer info, hoe gerichter we meedenken."
          required
        />
      </div>
      {status === 'error' && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 14 }}>
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
