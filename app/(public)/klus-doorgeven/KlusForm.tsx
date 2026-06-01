'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { createSupabaseBrowserClient } from '../../lib/db/client'
import { LocationInput } from '../../(portal)/portal/admin/_components/LocationInput'

type Status = 'idle' | 'submitting' | 'success' | 'error'
type Artist = { id: string; stage_name: string }

export function KlusForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [artists, setArtists] = useState<Artist[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data } = await supabase
          .from('artists')
          .select('id, stage_name')
          .eq('active', true)
          .order('stage_name', { ascending: true })
        setArtists((data as Artist[]) ?? [])
      } catch {
        setArtists([])
      }
    })()
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg(null)
    const data = new FormData(e.currentTarget)

    // Datum + (optionele) tijd → ISO-datetime voor event_start.
    const date = (data.get('event_date') as string) || ''
    const time = (data.get('event_start_time') as string) || ''
    let event_start: string | undefined
    if (date && time) {
      const d = new Date(`${date}T${time}`)
      if (!Number.isNaN(d.getTime())) event_start = d.toISOString()
    }

    try {
      const res = await fetch('/api/artist-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_id: data.get('artist_id') || '',
          client_name: data.get('client_name') || '',
          client_phone: data.get('client_phone') || '',
          event_date: date,
          event_start,
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
          Bedankt — je klus is doorgegeven aan Wittenboer. We bevestigen de details en regelen
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
      {/* Honeypot — verborgen voor mensen */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <div className="field">
        <label htmlFor="artist_id">Wie ben je?</label>
        <select id="artist_id" name="artist_id" defaultValue="" required>
          <option value="" disabled>
            Kies je artiestennaam…
          </option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.stage_name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="client_name">Voor wie / welk evenement?</label>
        <input
          id="client_name"
          name="client_name"
          type="text"
          placeholder="Bijv. Bruiloft Jansen, Kermis Oss, Café De Kroeg"
          required
        />
      </div>

      <div className="field--row">
        <div className="field">
          <label htmlFor="event_date">Datum</label>
          <input id="event_date" name="event_date" type="date" required />
        </div>
        <div className="field">
          <label htmlFor="event_start_time">Aanvang (optioneel)</label>
          <input id="event_start_time" name="event_start_time" type="time" />
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
        <label htmlFor="client_phone">Jouw telefoon (optioneel)</label>
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
