import type { Metadata } from 'next'
import Link from 'next/link'
import { KlusForm } from './KlusForm'

export const metadata: Metadata = {
  title: 'Klus doorgeven',
  description: 'Artiesten van Wittenboer geven hier hun optreden door — wij regelen licht, geluid, podium en crew.',
  // Alleen voor artiesten met de link — niet in zoekmachines.
  robots: { index: false, follow: false },
}

// Altijd vers de actuele artiesten tonen.
export const dynamic = 'force-dynamic'

export default function KlusDoorgevenPage() {
  return (
    <main>
      <header className="page-header">
        <div className="container page-header__inner" data-reveal-stagger>
          <div className="page-header__crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Klus doorgeven</span>
          </div>
          <h1>
            Jouw optreden, <span className="accent">wij regelen de rest.</span>
          </h1>
          <p className="page-header__lead">
            Heb je een boeking? Geef &lsquo;m hier even door — geen account, geen inloggedoe. Wij
            zorgen voor licht, geluid, podium en crew.
          </p>
        </div>
      </header>

      <section className="form-section">
        <div className="container form-grid">
          <div className="form-side" data-reveal>
            <p className="kicker">Even doorgeven</p>
            <h2>Vul kort je klus in.</h2>
            <p>
              Kies je naam, vul datum en locatie in en vertel wat je nodig hebt. Marnix bevestigt
              de details en plant de crew. Hoe meer je deelt, hoe strakker we het maken.
            </p>
            <div className="form-side__meta">
              <div className="form-side__row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <div>
                  <strong>Geen account nodig</strong>
                  <br />
                  Gewoon invullen en versturen
                </div>
              </div>
              <div className="form-side__row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <div>
                  <strong>Snel bevestigd</strong>
                  <br />
                  Meestal binnen één werkdag
                </div>
              </div>
              <div className="form-side__row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                <div>
                  <strong>Liever even bellen?</strong>
                  <br />
                  <a href="tel:+31627172876" style={{ color: 'inherit' }}>
                    06 27 17 28 76
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div data-reveal data-reveal-delay="2">
            <KlusForm />
          </div>
        </div>
      </section>
    </main>
  )
}
