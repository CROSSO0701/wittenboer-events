import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Showpakketten',
  description:
    'Vier kant-en-klare licht- en geluidsproducties voor bruiloften en privéfeesten. Vanaf €495.',
}

const FAQ = [
  {
    q: 'Zit een DJ bij de prijs?',
    a: 'Nee, de pakketten zijn de techniek (licht, geluid, opbouw). Een DJ kun je via ons boeken als losse aanvulling, of je regelt er zelf één. We werken samen met meerdere DJ\'s en kunnen er één voorstellen die bij je avond past.',
  },
  {
    q: 'Wat als de locatie geen stroom heeft?',
    a: 'Geen probleem. We leveren een aggregaat als losse upgrade. Geef bij de aanvraag aan dat de locatie buiten of zonder vaste stroom is, dan krijg je het meteen meegerekend in de offerte.',
  },
  {
    q: 'Hoe ver van \'s-Hertogenbosch werken jullie?',
    a: 'Heel Noord-Brabant en daarbuiten. Binnen 50 km geen voorrijkosten. Daarbuiten rekenen we een vaste reisvergoeding mee. We zijn al in Limburg, Zeeland, Gelderland en Antwerpen geweest met deze pakketten.',
  },
  {
    q: 'Wanneer moet ik reserveren?',
    a: 'Voor zaterdagen in mei–oktober en december: liefst 3–6 maanden vooruit. Doordeweekse data of buiten het seizoen kan vaak nog binnen 2–4 weken. Bel ons gerust, soms hebben we last-minute capaciteit.',
  },
  {
    q: 'Kunnen we een pakket aanpassen?',
    a: 'Zeker. De pakketten zijn een vertrekpunt. Een extra moving head, andere DJ-set, een rookmachine, confetti: laat het weten en we passen aan. Bij grotere wensen kijken we of een maatwerk-offerte beter past.',
  },
  {
    q: 'Hoe zit het met annuleren?',
    a: 'Tot 6 weken voor de datum kosteloos. Daarna afhankelijk van de termijn (staat in de offerte). Bij overmacht of ziekte zoeken we altijd naar een redelijke oplossing.',
  },
]

export default function ShowPakkettenPage() {
  return (
    <main>
      <header
        className="page-header page-header--photo"
        style={{ '--photo': "url('/photos/event-2.jpg')" } as React.CSSProperties}
      >
        <div className="container page-header__inner" data-reveal-stagger>
          <div className="page-header__crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Showpakketten</span>
          </div>
          <h1>
            Vier shows, <span className="accent">één telefoontje.</span>
          </h1>
          <p className="page-header__lead">
            Kant-en-klare disco-opbouwsets voor bruiloften en privéfeesten. We brengen, bouwen
            op, draaien de show, breken af. Je hoeft alleen de datum te bevestigen.
          </p>
        </div>
      </header>

      <section className="pkg-intro">
        <div className="container pkg-intro__grid">
          <div className="pkg-intro__lead" data-reveal>
            <p className="kicker">Showpakketten</p>
            <h2>Vooraf samengesteld. Op de avond perfect.</h2>
            <p>
              Vier vaste setups die we draaien op bruiloften, jubilea, verjaardagen en
              bedrijfsfeesten. Elk pakket is een complete licht- en geluidsproductie waar we
              honderden keren mee gewerkt hebben, en die we in een paar uur staan te bouwen.
            </p>
            <p>
              Prijzen zijn <em>vanaf</em>: de definitieve prijs hangt af van locatie,
              opbouwtijd, en of je nog een DJ via ons wilt boeken. Vraag een offerte voor de
              exacte prijs voor je datum.
            </p>
          </div>
          <ul className="pkg-intro__bullets" data-reveal data-reveal-delay="2">
            <li className="pkg-intro__bullet">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              <div>
                <strong>We bouwen op en breken af</strong>
                <span>Inclusief transport, montage, programmering en demontage.</span>
              </div>
            </li>
            <li className="pkg-intro__bullet">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <div>
                <strong>Reserveer ruim van tevoren</strong>
                <span>Zaterdagen in mei–oktober en december zijn meestal 3–6 maanden vooruit volgeboekt.</span>
              </div>
            </li>
            <li className="pkg-intro__bullet">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              <div>
                <strong>Locatie-check als het nodig is</strong>
                <span>Onbekende zaal of strakke opbouwtijd? We komen vooraf langs of bellen de locatiehouder.</span>
              </div>
            </li>
            <li className="pkg-intro__bullet">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <div>
                <strong>Vragen over een upgrade?</strong>
                <span>Niet zeker wat je nodig hebt? Bel ons gerust, we adviseren eerlijk, ook als dat een kleiner pakket is.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="compare">
        <div className="container">
          <div className="compare__inner">
            <div>
              <div className="compare__label">Niet zeker welk pakket past?</div>
              <div className="compare__title">Stuur een korte beschrijving en we adviseren binnen een dag.</div>
            </div>
            <Link className="compare__cta" href="/contact">Vraag advies</Link>
          </div>
        </div>
      </section>

      <section className="pkgs">
        <div className="container">
          <div className="pkg-grid" data-reveal-stagger>
            {/* COMPACT */}
            <article className="pkg-card">
              <div className="pkg-card__media">
                <span className="pkg-card__badge">Instap</span>
                <div
                  className="pkg-card__media-photo"
                  style={{ backgroundImage: "url('/photos/show-packages/compact.jpg')" }}
                />
              </div>
              <div className="pkg-card__body">
                <div className="pkg-card__head">
                  <div className="pkg-card__name">Compact</div>
                  <div className="pkg-card__price-block">
                    <div className="pkg-card__price-label">Vanaf</div>
                    <div className="pkg-card__price">€495</div>
                  </div>
                </div>
                <ul className="pkg-card__incl">
                  <li>1× DJ-meubel truss met LED parren</li>
                  <li>1× 4-bar lichtbar</li>
                  <li>1× Pioneer-set (CDJ + mixer)</li>
                </ul>
                <p className="pkg-card__hint">Voor verjaardagen en kleinere zalen tot ±80 gasten.</p>
                <div className="pkg-card__foot">
                  <Link className="btn-primary" href="/contact?pakket=compact">Vraag offerte</Link>
                  <a className="btn-ghost" href="tel:+31627172876">Bel voor info</a>
                </div>
              </div>
            </article>

            {/* BOOTH */}
            <article className="pkg-card">
              <div className="pkg-card__media">
                <span className="pkg-card__badge">Compleet</span>
                <div
                  className="pkg-card__media-photo"
                  style={{ backgroundImage: "url('/photos/show-packages/booth.jpg')" }}
                />
              </div>
              <div className="pkg-card__body">
                <div className="pkg-card__head">
                  <div className="pkg-card__name">Booth</div>
                  <div className="pkg-card__price-block">
                    <div className="pkg-card__price-label">Vanaf</div>
                    <div className="pkg-card__price">€595</div>
                  </div>
                </div>
                <ul className="pkg-card__incl">
                  <li>2× 4-bar lichtbar</li>
                  <li>1× DJ-booth met 4 LED parren</li>
                  <li>1× Pioneer-set (CDJ + mixer)</li>
                  <li>1× booth-monitor</li>
                  <li>1× set d&amp;b audio</li>
                </ul>
                <p className="pkg-card__hint">Strak DJ-booth met d&amp;b geluid. Tot ±150 gasten.</p>
                <div className="pkg-card__foot">
                  <Link className="btn-primary" href="/contact?pakket=booth">Vraag offerte</Link>
                  <a className="btn-ghost" href="tel:+31627172876">Bel voor info</a>
                </div>
              </div>
            </article>

            {/* TRUSS SHOW (FEATURE) */}
            <article className="pkg-card pkg-card--feature">
              <div className="pkg-card__media">
                <span className="pkg-card__badge">Populairste</span>
                <div
                  className="pkg-card__media-photo"
                  style={{ backgroundImage: "url('/photos/show-packages/truss-show.jpg')" }}
                />
              </div>
              <div className="pkg-card__body">
                <div className="pkg-card__head">
                  <div className="pkg-card__name">Truss Show</div>
                  <div className="pkg-card__price-block">
                    <div className="pkg-card__price-label">Vanaf</div>
                    <div className="pkg-card__price">€695</div>
                  </div>
                </div>
                <ul className="pkg-card__incl">
                  <li>4× truss-paal met LED par + moving head</li>
                  <li>1× truss-booth met LED parren</li>
                  <li>1× DJ-set (CDJ + mixer)</li>
                  <li>1× monitor</li>
                  <li>1× Pioneer-set</li>
                </ul>
                <p className="pkg-card__hint">De full-show. Tot ±250 gasten, afgebeeld op de foto.</p>
                <div className="pkg-card__foot">
                  <Link className="btn-primary" href="/contact?pakket=truss-show">Vraag offerte</Link>
                  <a
                    className="btn-ghost"
                    href="tel:+31627172876"
                    style={{ borderColor: 'var(--color-border-on-dark)', color: 'var(--color-fg-on-dark)' }}
                  >
                    Bel voor info
                  </a>
                </div>
              </div>
            </article>

            {/* SHOW WIT */}
            <article className="pkg-card">
              <div className="pkg-card__media">
                <span className="pkg-card__badge" style={{ background: 'var(--color-tertiary-deep)' }}>
                  Premium · wit
                </span>
                <div
                  className="pkg-card__media-photo"
                  style={{ backgroundImage: "url('/photos/show-packages/show-wit.jpg')" }}
                />
              </div>
              <div className="pkg-card__body">
                <div className="pkg-card__head">
                  <div className="pkg-card__name">Show Wit</div>
                  <div className="pkg-card__price-block">
                    <div className="pkg-card__price-label">Vanaf</div>
                    <div className="pkg-card__price">€795</div>
                  </div>
                </div>
                <ul className="pkg-card__incl">
                  <li>4× truss-paal met witte slave</li>
                  <li>4× moving head</li>
                  <li>4× LED par</li>
                  <li>1× DJ-booth wit</li>
                  <li>1× set d&amp;b audio</li>
                  <li>1× Pioneer-set</li>
                  <li>1× booth-monitor</li>
                </ul>
                <p className="pkg-card__hint">Bruiloften en chique gala-avonden. Witte uitstraling.</p>
                <div className="pkg-card__foot">
                  <Link className="btn-primary" href="/contact?pakket=show-wit">Vraag offerte</Link>
                  <a className="btn-ghost" href="tel:+31627172876">Bel voor info</a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="incl">
        <div className="container">
          <div className="incl__head" data-reveal>
            <p className="kicker">Bij elk pakket inbegrepen</p>
            <h2>Eén prijs. Geen verrassingen.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--color-fg-secondary)' }}>
              Alles wat hieronder staat zit standaard in elk showpakket. Je betaalt alleen extra
              voor: een DJ via ons (op aanvraag), een tweede dag, of speciale wensen zoals
              rookmachine of confetti.
            </p>
          </div>
          <div className="incl__grid" data-reveal-stagger>
            <div className="incl__item">
              <div className="incl__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16,8 20,8 23,11 23,16 16,16" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3>Transport</h3>
              <p>We brengen alles in onze eigen bus. Aanrijden vanuit &lsquo;s-Hertogenbosch e.o. binnen 50 km gratis.</p>
            </div>
            <div className="incl__item">
              <div className="incl__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <polyline points="2,17 12,22 22,17" />
                  <polyline points="2,12 12,17 22,12" />
                </svg>
              </div>
              <h3>Opbouw &amp; afbouw</h3>
              <p>Twee technici komen 2–4 uur voor aanvang. Na afloop alles weer mee. Je hoeft niets.</p>
            </div>
            <div className="incl__item">
              <div className="incl__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <h3>Programmering</h3>
              <p>Lichtshow vooraf geprogrammeerd. Op de avond zelf staat er iemand achter de console.</p>
            </div>
            <div className="incl__item">
              <div className="incl__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <h3>Aanspreekpunt</h3>
              <p>Eén nummer voor de hele avond. Iets gaat fout? We lossen het op zonder dat je merkt dat het er was.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pkg-flow">
        <div className="container">
          <div className="section-head" data-reveal style={{ marginBottom: 56 }}>
            <div>
              <p className="kicker">Hoe het werkt</p>
              <h2 style={{ fontSize: 'clamp(2rem, 1.4rem + 2.2vw, 3rem)', maxWidth: '18ch' }}>
                Van aanvraag tot afterparty.
              </h2>
            </div>
            <p className="section-head__lead">In vier stappen. Geen contracten van zes pagina&apos;s.</p>
          </div>
          <div className="pkg-flow__grid" data-reveal-stagger>
            <div className="pkg-flow__step">
              <span className="pkg-flow__num">01 / Aanvraag</span>
              <h3>Stuur details</h3>
              <p>Datum, locatie, aantal gasten. Welk pakket spreekt aan. Liefst even kort wat de avond is.</p>
            </div>
            <div className="pkg-flow__step">
              <span className="pkg-flow__num">02 / Offerte</span>
              <h3>Vaste prijs</h3>
              <p>Binnen één werkdag een offerte met vaste prijs. Geen voorrijkosten, geen uurtjes-factuurtjes.</p>
            </div>
            <div className="pkg-flow__step">
              <span className="pkg-flow__num">03 / Reservering</span>
              <h3>Bevestig &amp; check</h3>
              <p>Akkoord? Datum staat vast. Onbekende zaal? Locatiebezoek of korte bel met de venue.</p>
            </div>
            <div className="pkg-flow__step">
              <span className="pkg-flow__num">04 / Showtime</span>
              <h3>Wij doen de rest</h3>
              <p>Opbouw, programmering, show, afbouw. Je hoeft alleen te genieten van de avond.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pkg-faq">
        <div className="container">
          <div className="pkg-faq__inner">
            <div data-reveal>
              <p className="kicker">Vragen vooraf</p>
              <h2>Wat wij het vaakst horen.</h2>
            </div>
            <div className="pkg-faq__list">
              {FAQ.map((f) => (
                <details key={f.q} className="pkg-faq__item">
                  <summary>{f.q}</summary>
                  <div className="pkg-faq__answer">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="closing" style={{ background: 'var(--color-surface-dark)', color: 'var(--color-fg-on-dark)' }}>
        <div className="container">
          <p className="kicker" style={{ color: 'var(--color-tertiary)', marginBottom: 16 }}>
            Klaar voor je avond?
          </p>
          <h2 style={{ color: 'var(--color-fg-on-dark)' }}>Reserveer een pakket. Wij bouwen.</h2>
          <p style={{ color: 'var(--color-fg-on-dark-muted)', margin: '0 auto 32px', maxInlineSize: '52ch', fontSize: 17 }}>
            Korte aanvraag is genoeg. Datum, locatie, welk pakket je in gedachten hebt. We
            sturen binnen één werkdag een offerte met vaste prijs.
          </p>
          <div className="closing__ctas">
            <Link className="btn-primary" href="/contact">Vraag een offerte</Link>
            <a
              className="btn-ghost"
              href="tel:+31627172876"
              style={{ borderColor: 'var(--color-border-on-dark)', color: 'var(--color-fg-on-dark)' }}
            >
              Bel 06 27 17 28 76
            </a>
            <a
              className="btn-ghost"
              href="/show-pakketten/brochure?print=1"
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderColor: 'var(--color-border-on-dark)', color: 'var(--color-fg-on-dark)' }}
            >
              Download brochure (PDF)
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
