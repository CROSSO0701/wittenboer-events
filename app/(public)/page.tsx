import Link from 'next/link'
import SplitText from '../components/shared/SplitText'

const ICON_ARROW_RIGHT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
)

const ICON_NORTHEAST = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M7 17L17 7" />
    <path d="M8 7h9v9" />
  </svg>
)

const ICON_NORTHEAST_18 = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <path d="M7 17L17 7" />
    <path d="M8 7h9v9" />
  </svg>
)

const ICON_DIAMOND = (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l10 10-10 10L2 12z" />
  </svg>
)

const TRUSTED = [
  'Park Lounge Schijndel',
  'Megapark Schijndel',
  'Jan Biggel',
  'Ferry de Lits',
  'Berk Music',
  'Beurs Schijndel',
  'Coreworks Steigerbouw',
  'Roxxi',
]

const HOME_ARTISTS = [
  { name: 'Jan Biggel', photo: '/photos/artist-jan-biggel.jpg' },
  { name: 'Mikey Wonder', photo: '/photos/artist-mikey-wonder.jpg' },
  { name: 'Mo de Show', photo: '/photos/artist-mo-de-show.jpg' },
  { name: 'Frank van Weert', photo: '/photos/artist-frank-van-weert.jpg' },
]

export default function Page() {
  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div
          className="hero__photo"
          style={{ backgroundImage: "url('/photos/event-2.jpg')" }}
        />
        <div className="hero__overlay-1" />
        <div className="hero__overlay-2" />
        <div className="hero__content container">
          <p className="hero__kicker" data-reveal>
            <span />
            Regio &lsquo;s-Hertogenbosch · Sinds 2014
          </p>
          <div className="hero__head">
            <h1 className="hero__h1">
              <SplitText text="Licht, geluid" />
              <span className="accent">
                <SplitText text="en een show die knalt." perWordDelay={0.06} />
              </span>
            </h1>
            <div className="hero__body-row">
              <div>
                <p className="hero__lead" data-reveal data-reveal-delay="2">
                  Van drive-in tot festival voor 5000 bezoekers. Eén team, A-merk materiaal,
                  en techniek die u vergeet omdat alles werkt.
                </p>
              </div>
              <div className="hero__cta-row" data-reveal data-reveal-delay="3">
                <Link href="/contact" className="btn-primary">
                  Vraag een offerte aan
                  {ICON_ARROW_RIGHT}
                </Link>
                <Link href="/aanbod" className="btn-ghost">Bekijk wat wij doen</Link>
              </div>
            </div>
          </div>
          <dl className="hero__metrics" data-reveal-stagger>
            <div>
              <dt>Sinds</dt>
              <dd>2014</dd>
            </div>
            <div>
              <dt>Producties</dt>
              <dd>400+</dd>
            </div>
            <div>
              <dt>Klachten buren</dt>
              <dd>Nul</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* TRUSTED */}
      <section className="trusted">
        <div className="container trusted__label-row">
          <span />
          <p>Eerder geregeld voor</p>
        </div>
        <div className="trusted__viewport">
          <div className="trusted__track marquee-track">
            {[...TRUSTED, ...TRUSTED].map((name, i) => (
              <span key={`${name}-${i}`} className="trusted__name">
                {name} <span className="trusted__sep" style={{ color: 'var(--color-primary)' }}>{ICON_DIAMOND}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO / OVER ONS */}
      <section className="intro">
        <div className="container intro__inner">
          <div className="intro__copy" data-reveal>
            <p className="kicker">Over ons</p>
            <h2 className="intro__h2">Een team dat al ruim tien jaar evenementen op poten zet.</h2>
            <p className="intro__lead">
              Wittenboer Events draait sinds 2014 producties door heel Brabant en daarbuiten.
              Vaste crew, eigen materiaal, één draaiboek. Bedrijfsfeest, festival, beurs of
              bruiloft. Wij regelen geluid, licht, stroom en artiesten, van eerste belronde tot
              laatste pallet terug in de bus.
            </p>
            <Link href="/over-ons" className="intro__cta">
              Maak kennis met het team
              {ICON_ARROW_RIGHT}
            </Link>
          </div>
          <div className="intro__portrait" data-reveal data-reveal-delay="2">
            <div
              className="intro__portrait-img"
              style={{ backgroundImage: "url('/photos/portrait-marnix.jpg')" }}
            />
            <p className="intro__sig">
              <span>Het Wittenboer-team</span>
              <span className="intro__sig-role">Crew van vaste freelancers · sinds 2014</span>
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="diensten">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Wat wij doen</p>
              <h2>Alles voor uw evenement, in één bus.</h2>
            </div>
            <p className="section-head__lead">
              Geluid, licht, stroom, artiesten. Los of compleet. Kies wat u nodig hebt, of laat
              ons het hele plaatje doen.
            </p>
          </div>
          <div className="services__grid" data-reveal-stagger>
            <Link href="/aanbod/geluid" className="service-card service-card--photo service-card--hero span-7-r2">
              <div className="service-card__photo" style={{ backgroundImage: "url('/photos/studio-023.jpg')" }} />
              <div className="service-card__inner">
                <div className="service-card__head" />
                <div>
                  <h3>Geluid</h3>
                  <p>
                    Goed geluid op een kantoorfeestje of een festival met 5000 bezoekers. Wij
                    regelen beide.
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/aanbod/licht" className="service-card service-card--photo span-5">
              <div className="service-card__photo" style={{ backgroundImage: "url('/photos/park-lounge-2.jpg')" }} />
              <div className="service-card__inner">
                <div className="service-card__head">
                  <h3>Licht</h3>
                  <span className="service-card__arrow" aria-hidden="true">{ICON_NORTHEAST}</span>
                </div>
                <p>Een goede belichting bepaalt de hele sfeer van uw evenement.</p>
              </div>
            </Link>
            <Link href="/aanbod/artiestenbegeleiding" className="service-card service-card--flat span-5">
              <div className="service-card__inner">
                <div className="service-card__head">
                  <h3>Tapeshows</h3>
                  <span className="service-card__arrow" aria-hidden="true">{ICON_NORTHEAST}</span>
                </div>
                <p>
                  Professionele tape-begeleiding voor artiesten. Wij kennen de repertoires van de
                  meeste Nederlandse zangers.
                </p>
              </div>
            </Link>
            <Link href="/aanbod/stroomvoorziening" className="service-card service-card--flat span-4">
              <div className="service-card__inner">
                <div className="service-card__head">
                  <h3>Stroomvoorziening</h3>
                  <span className="service-card__arrow" aria-hidden="true">{ICON_NORTHEAST}</span>
                </div>
                <p>Tijdelijke stroomvoorziening voor festivals, beurzen en bedrijfsevenementen.</p>
              </div>
            </Link>
            <Link href="/aanbod/artiestenbegeleiding" className="service-card service-card--flat span-4">
              <div className="service-card__inner">
                <div className="service-card__head">
                  <h3>Artiesten&shy;begeleiding</h3>
                  <span className="service-card__arrow" aria-hidden="true">{ICON_NORTHEAST}</span>
                </div>
                <p>Van aankomst tot laatste encore. Wij regelen de backstage.</p>
              </div>
            </Link>
            <Link href="/aanbod/productiebegeleiding" className="service-card service-card--flat span-4">
              <div className="service-card__inner">
                <div className="service-card__head">
                  <h3>Productie&shy;begeleiding</h3>
                  <span className="service-card__arrow" aria-hidden="true">{ICON_NORTHEAST}</span>
                </div>
                <p>Van eerste gesprek tot en met de afbouw. End-to-end coördinatie.</p>
              </div>
            </Link>
          </div>
          <div className="services__all">
            <Link href="/aanbod" className="intro__cta">
              Bekijk het volledige aanbod
              {ICON_ARROW_RIGHT}
            </Link>
            <p className="services__more">
              Ook: Stroomvoorziening · Artiestenbegeleiding · Productiebegeleiding
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED WORK */}
      <section className="featured" id="werk">
        <div className="container">
          <p className="featured__kicker" data-reveal>Uitgelicht</p>
          <h2 data-reveal data-reveal-delay="1">
            Park Lounge &amp; Megapark Schijndel.{' '}
            <span className="accent">Twee shows, twee verhalen.</span>
          </h2>
          <div className="featured__split" data-reveal-stagger>
            <Link className="featured__case" href="/projecten#park-lounge">
              <div
                className="featured__case-photo"
                style={{ backgroundImage: "url('/photos/project-park-lounge.jpg')" }}
              />
              <div className="featured__case-body">
                <p className="featured__case-meta">Festival · Schijndel · 2023</p>
                <h3>Park Lounge</h3>
                <p>
                  Festival in een woonwijk. Gerichte arrays, continue meting, contact met de
                  buurt. Show op volume. Nul klachten.
                </p>
                <ul className="featured__case-tags">
                  <li>Geluid</li><li>Licht</li><li>Stroom</li><li>Metingen</li>
                </ul>
              </div>
            </Link>
            <Link className="featured__case" href="/projecten#megapark">
              <div
                className="featured__case-photo"
                style={{ backgroundImage: "url('/photos/project-megapark.jpg')" }}
              />
              <div className="featured__case-body">
                <p className="featured__case-meta">Beurs · Schijndel · 2022</p>
                <h3>Megapark</h3>
                <p>
                  Drie dagen, twee podia, één draaiboek. Volledige technische productie inclusief
                  artiestenbegeleiding op locatie.
                </p>
                <ul className="featured__case-tags">
                  <li>Geluid</li><li>Licht</li><li>Artiesten</li><li>Productie</li>
                </ul>
              </div>
            </Link>
          </div>
          <Link href="/projecten" className="featured__cta">
            <span>Bekijk alle projecten</span>
            {ICON_ARROW_RIGHT}
          </Link>
        </div>
      </section>

      {/* ARTISTS */}
      <section className="artists">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Artiesten</p>
              <h2>Wij boeken, wij kennen ze.</h2>
            </div>
            <p className="section-head__lead">
              Wij draaien al jaren tapes voor Nederlandse zangers. Kies een artiest, wij regelen
              de techniek eromheen.
            </p>
          </div>
          <div className="artists__grid" data-reveal-stagger>
            {HOME_ARTISTS.map((a) => (
              <Link key={a.name} href="/artiesten" className="artist">
                <div
                  className="artist__photo"
                  style={{ backgroundImage: `url('${a.photo}')` }}
                />
                <div className="artist__name-row">
                  <span className="artist__name">{a.name}</span>
                  <span className="artist__arrow" aria-hidden="true">{ICON_NORTHEAST}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="artists__bottom">
            <Link href="/artiesten">
              <span>Alle 10 artiesten</span>
              {ICON_ARROW_RIGHT}
            </Link>
            <p className="artists__bottom-list">Guus Doggen · Daymian van Oss · Mark van Veen · Remco Voets</p>
          </div>
        </div>
      </section>

      {/* QUOTES */}
      <section className="quotes">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Wat klanten zeggen</p>
              <h2>Volledig ontzorgd, van A tot Z.</h2>
            </div>
          </div>
          <div className="quotes__grid">
            <figure className="quote-hero" data-reveal>
              <span className="quote-hero__mark" aria-hidden="true">&ldquo;</span>
              <blockquote>
                Marnix nam het werk volledig uit mijn handen. Van A tot Z. Ik kon mij richten op
                het festival; hij regelde de techniek.
              </blockquote>
              <figcaption>
                <span className="quote-hero__avatar" />
                <span>
                  <strong>Thomas de Groot</strong>
                  <span className="role">Oprichter Park Lounge</span>
                </span>
              </figcaption>
            </figure>
            <div className="quotes__supports">
              <figure className="quote-mini" data-reveal data-reveal-delay="2">
                <blockquote>
                  Het team maakte het proces zo eenvoudig dat wij ons konden concentreren op het
                  runnen van het evenement zelf.
                </blockquote>
                <figcaption>
                  <strong>Bert van Kronenburg</strong>
                  <span className="role">Eigenaar Beurs Schijndel</span>
                </figcaption>
              </figure>
              <figure className="quote-mini" data-reveal data-reveal-delay="3">
                <blockquote>
                  Wittenboer is voor ons de automatische keuze. Licht, geluid,
                  artiestenbegeleiding, logistiek. Altijd meedenkend.
                </blockquote>
                <figcaption>
                  <strong>Berk Music</strong>
                  <span className="role">Label &amp; management</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* APPROACH */}
      <section className="approach">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Hoe wij werken</p>
              <h2>Eén aanspreekpunt. Eén draaiboek.</h2>
            </div>
          </div>
          <div className="approach__grid" data-reveal-stagger>
            <div className="approach__step">
              <span className="approach__num">01 / Bellen</span>
              <h3>Bellen<span className="dot" /></h3>
              <p>U belt of mailt. Wij komen langs of regelen het telefonisch — en denken meteen mee.</p>
            </div>
            <div className="approach__step">
              <span className="approach__num">02 / Plan</span>
              <h3>Plan<span className="dot" /></h3>
              <p>Technisch ontwerp, geluidsmetingen, artiesten, vergunningen. Alles in één draaiboek.</p>
            </div>
            <div className="approach__step">
              <span className="approach__num">03 / Knallen</span>
              <h3>Knallen<span className="dot" /></h3>
              <p>Wij bouwen op, draaien de show, breken af. U bij de gasten. Wij op de techniek.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="contact-cta" id="contact">
        <div className="container">
          <div className="contact-cta__head">
            <div data-reveal>
              <p className="kicker">Zin in?</p>
              <h2>Bel, app, of loop binnen.</h2>
            </div>
            <p data-reveal data-reveal-delay="2">
              Elk evenement is anders. Wij denken graag vroeg mee. Hoe eerder u belt, hoe strakker
              het wordt.
            </p>
          </div>
          <div className="contact-cta__channels" data-reveal-stagger>
            <a href="tel:+31627172876" className="channel">
              <span className="channel__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <div>
                <p className="channel__label">Bellen</p>
                <p className="channel__value">06 27 17 28 76</p>
              </div>
              <span className="channel__corner" aria-hidden="true">{ICON_NORTHEAST_18}</span>
            </a>
            <a href="https://wa.me/31627172876" target="_blank" rel="noopener" className="channel">
              <span className="channel__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </span>
              <div>
                <p className="channel__label">WhatsApp</p>
                <p className="channel__value">Stuur ons een berichtje</p>
              </div>
              <span className="channel__corner" aria-hidden="true">{ICON_NORTHEAST_18}</span>
            </a>
            <a href="mailto:info@wittenboerevents.nl" className="channel">
              <span className="channel__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <div>
                <p className="channel__label">Mailen</p>
                <p className="channel__value">info@wittenboerevents.nl</p>
              </div>
              <span className="channel__corner" aria-hidden="true">{ICON_NORTHEAST_18}</span>
            </a>
          </div>
          <div className="contact-cta__address">
            <div className="contact-cta__address-text">
              <span className="contact-cta__address-label">Langskomen: </span>
              Het Schild 35, 5275 EE Den Dungen
            </div>
            <a
              href="https://maps.google.com/?q=Het+Schild+35+Den+Dungen"
              target="_blank"
              rel="noopener"
              className="contact-cta__map-link"
            >
              Route op Maps
              {ICON_NORTHEAST}
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
