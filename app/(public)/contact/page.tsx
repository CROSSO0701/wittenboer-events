import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ContactForm } from '../../components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Bel, app of mail Wittenboer Events in Den Dungen (regio ’s-Hertogenbosch). Persoonlijk contact, korte lijnen. Wij denken graag vroeg mee.',
}

export default function ContactPage() {
  return (
    <main>
      <header className="page-header">
        <div className="container page-header__inner" data-reveal-stagger>
          <div className="page-header__crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Contact</span>
          </div>
          <h1>
            Bel, app, <span className="accent">of loop binnen.</span>
          </h1>
          <p className="page-header__lead">
            Elk evenement is anders. We denken graag vroeg mee. Hoe eerder je belt, hoe strakker
            het wordt.
          </p>
        </div>
      </header>

      <section className="channels">
        <div className="container">
          <div className="channels__grid" data-reveal-stagger>
            <a className="ch-card" href="tel:+31627172876">
              <div className="ch-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <span className="ch-card__label">Bellen</span>
              <span className="ch-card__value">06 27 17 28 76</span>
              <span className="ch-card__hint">
                Werkdagen 08:00 – 17:00 · wij nemen meestal binnen het uur op
              </span>
            </a>
            <a className="ch-card" href="https://wa.me/31627172876" target="_blank" rel="noopener">
              <div className="ch-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </div>
              <span className="ch-card__label">WhatsApp</span>
              <span className="ch-card__value">Direct een bericht</span>
              <span className="ch-card__hint">Reactie meestal binnen het uur · 24/7</span>
            </a>
            <a className="ch-card" href="mailto:info@wittenboerevents.nl">
              <div className="ch-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span className="ch-card__label">Mail</span>
              <span className="ch-card__value">info@wittenboerevents.nl</span>
              <span className="ch-card__hint">Voor uitgebreide aanvragen of bijlagen</span>
            </a>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="container form-grid">
          <div className="form-side" data-reveal>
            <p className="kicker">Of stuur een aanvraag</p>
            <h2>Vertel ons kort over je evenement.</h2>
            <p>
              We reageren binnen één werkdag. Hoe meer je nu deelt (datum, locatie,
              aantal gasten, wat je nodig hebt), hoe gerichter we meedenken.
            </p>
            <div className="form-side__meta">
              <div className="form-side__row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <strong>Het Schild 35</strong>
                  <br />
                  5275 EE Den Dungen
                </div>
              </div>
              <div className="form-side__row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <div>
                  <strong>Werkdagen 08:00 – 17:00</strong>
                  <br />
                  24/7 via WhatsApp en mail
                </div>
              </div>
              <div className="form-side__row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div>
                  <strong>Snel afspreken?</strong>
                  <br />
                  Locatie-bezoeken meestal binnen 2 weken
                </div>
              </div>
            </div>
          </div>
          <div data-reveal data-reveal-delay="2">
            <Suspense fallback={null}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="section section--surface-1" style={{ padding: '64px 0 96px' }}>
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Op de kaart</p>
              <h2>Regio &lsquo;s-Hertogenbosch.</h2>
            </div>
            <p className="section-head__lead">
              Wij werken in heel Noord-Brabant en daarbuiten. Voor locatiebezoeken in een straal
              van 50 km rekenen wij niets.
            </p>
          </div>
          <div className="map" data-reveal>
            <iframe
              src="https://www.google.com/maps?q=Het+Schild+35,+Den+Dungen&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Wittenboer Events op Google Maps"
              allowFullScreen
            />
            <div className="map__overlay">
              <strong>Het Schild 35</strong>
              5275 EE Den Dungen
              <br />
              <a
                href="https://maps.google.com/?q=Het+Schild+35+Den+Dungen"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
