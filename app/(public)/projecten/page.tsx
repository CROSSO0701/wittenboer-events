import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projecten',
  description:
    'Uitgelicht werk van Wittenboer Events: Park Lounge Schijndel en Megapark Schijndel. Een greep uit 400+ producties.',
}

const MORE = [
  { meta: '2024 · Tuinfeest', title: 'Buitenfeest Berlicum', loc: 'Privé · 250 gasten', photo: '/photos/event-1.jpg' },
  { meta: '2023 · Bedrijfsfeest', title: 'Berk Music Showcase', loc: 'Den Bosch · 600 gasten', photo: '/photos/event-4.jpg' },
  { meta: '2023 · Beurs', title: 'Beurs Schijndel', loc: 'Schijndel · 3-daags', photo: '/photos/event-5.jpg' },
  { meta: '2022 · Drive-in', title: 'Twee Brouwers Gestel', loc: 'Sint-Michielsgestel', photo: '/photos/event-2.jpg' },
]

export default function ProjectenPage() {
  return (
    <main>
      <header
        className="page-header page-header--photo"
        style={{ '--photo': "url('/photos/project-park-lounge.jpg')" } as React.CSSProperties}
      >
        <div className="container page-header__inner" data-reveal-stagger>
          <div className="page-header__crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Projecten</span>
          </div>
          <h1>
            Wat wij hebben <span className="accent">gedraaid.</span>
          </h1>
          <p className="page-header__lead">
            Een selectie uit 400+ producties sinds 2014. Van festivals in een woonwijk tot
            themaparken in Mallorca-stijl.
          </p>
        </div>
      </header>

      <section className="projects">
        <div className="container">
          <div className="projects__intro" data-reveal>
            <p className="kicker">Cases</p>
            <p>
              Twee uitgewerkte cases, vier projecten in het kort. Voor elke case staat: wat het
              project was, wat wij deden, en wat de opdrachtgever erover zei.
            </p>
          </div>

          <article className="case" id="park-lounge" data-reveal>
            <div className="case__photo" data-img-zoom>
              <Image
                src="/photos/project-park-lounge.jpg"
                alt="Park Lounge Festival Schijndel"
                width={1200}
                height={900}
              />
            </div>
            <div>
              <div className="case__meta">
                <span>2023</span>
                <span>Schijndel</span>
                <span>Festival</span>
              </div>
              <h2>Park Lounge Festival.</h2>
              <p>
                Festival in een woonwijk. Een locatie met akoestische uitdagingen en gevoelige
                buren. Wij hebben gerichte microfoonarrays opgesteld, monitoringapparatuur in de
                buurt geplaatst en het geluid verantwoord beheerd. Op alle podia verzorgden wij
                licht- en geluidstechniek. Resultaat: minimaal klachten uit de buurt, een show
                van hoog niveau.
              </p>
              <ul className="case__scope">
                <li>Geluid op alle podia</li>
                <li>Volledig lichtplan en uitvoering</li>
                <li>Stroomvoorziening festivalterrein</li>
                <li>Geluidsmetingen en buurtbewaking</li>
              </ul>
              <div className="case__quote">
                <p>
                  &ldquo;Ik ben zeer tevreden over de diensten van Wittenboer Events en de
                  professionele hulp van Marnix bij het organiseren van ons festival. Hij nam
                  het werk volledig uit mijn handen, van A tot Z. Zeker een aanrader voor
                  toekomstige evenementen.&rdquo;
                </p>
                <div className="case__quote-cite">
                  <strong>Thomas de Groot</strong> · Oprichter Park Lounge
                </div>
              </div>
            </div>
          </article>

          <article className="case" id="megapark" data-reveal>
            <div className="case__photo" data-img-zoom>
              <Image
                src="/photos/project-megapark.jpg"
                alt="Megapark Schijndel"
                width={1200}
                height={900}
              />
            </div>
            <div>
              <div className="case__meta">
                <span>2022</span>
                <span>Schijndel</span>
                <span>Themafeest</span>
              </div>
              <h2>Megapark Schijndel.</h2>
              <p>
                Een thema-evenement in de sfeer van het Megapark op Mallorca. Wij bouwden
                aangepaste installaties waaronder een werkende fontein op het hoofdpodium en
                verlichte danskooien met gesynchroniseerde lichteffecten. Artiestenboeking en
                backstage-coördinatie werden volledig door ons verzorgd. Alle artiesten waren
                via Wittenboer Events geboekt.
              </p>
              <ul className="case__scope">
                <li>Volledige technische productie</li>
                <li>Artiestenboeking en -begeleiding</li>
                <li>Backstage-coördinatie</li>
                <li>Speciale installaties (fontein, danskooien)</li>
              </ul>
              <div className="case__quote">
                <p>
                  &ldquo;Ik was onder de indruk van de professionele houding van het team, met
                  name Marnix die de complete lichtshow verzorgde. Ze maakten het proces zo
                  eenvoudig voor ons dat wij ons konden concentreren op het runnen van het
                  evenement zelf.&rdquo;
                </p>
                <div className="case__quote-cite">
                  <strong>Bert van Kronenburg</strong> · Eigenaar Beurs Schijndel
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="more-grid">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Meer projecten</p>
              <h2>Een greep uit het archief.</h2>
            </div>
            <p className="section-head__lead">
              Korte impressies. Vraag een uitgebreide referentie als u iets vergelijkbaars
              overweegt &mdash; wij hebben de detail-draaiboeken nog liggen.
            </p>
          </div>
          <div className="more-grid__cards" data-reveal-stagger>
            {MORE.map((m) => (
              <article key={m.title} className="mini">
                <div className="mini__photo" style={{ backgroundImage: `url('${m.photo}')` }} />
                <div className="mini__inner">
                  <span className="mini__meta">{m.meta}</span>
                  <div className="mini__title">{m.title}</div>
                  <span className="mini__loc">{m.loc}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="closing"
        style={{ background: 'var(--color-surface-dark)', color: 'var(--color-fg-on-dark)' }}
      >
        <div className="container">
          <p className="kicker" style={{ color: 'var(--color-tertiary)', marginBottom: 16 }}>
            Iets vergelijkbaars in plan?
          </p>
          <h2 style={{ color: 'var(--color-fg-on-dark)' }}>Vraag een referentie aan.</h2>
          <p style={{ color: 'var(--color-fg-on-dark-muted)', margin: '0 auto 32px', maxInlineSize: '52ch', fontSize: 17 }}>
            Wij bellen vorige opdrachtgevers graag voor u. Of stuur ons een korte beschrijving
            en wij kijken welke case het dichtst bij ligt.
          </p>
          <div className="closing__ctas">
            <Link className="btn-primary" href="/contact">Neem contact op</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
