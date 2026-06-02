import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Over ons',
  description:
    'Wittenboer Events is sinds 2014 actief in de regio \'s-Hertogenbosch. Vaste crew, eigen materiaal, persoonlijk contact.',
}

const WHY = [
  {
    n: '01',
    title: 'Complete A tot Z productie',
    body:
      'Licht, geluid, stroom, artiesten, backstage. Alles via één partij. Geen losse offertes stapelen, geen coördinatieproblemen op de dag zelf.',
  },
  {
    n: '02',
    title: 'A-merk materiaal',
    body:
      'L-Acoustics, d&b, Robe, Avolites, MA Lighting. We werken alleen met apparatuur die doet wat het belooft, onder alle omstandigheden.',
  },
  {
    n: '03',
    title: 'Meedenken op voorhand',
    body:
      'We komen langs op de locatie, meten na en stellen alternatieven voor. Het plan dat je krijgt is al door een technisch oog gehaald, niet alleen door een verkoper.',
  },
  {
    n: '04',
    title: 'Persoonlijk contact',
    body:
      'Je belt met een van onze vaste technici, niet met een planner. De crew die het plan maakt, staat ook op de dag zelf naast je.',
  },
  {
    n: '05',
    title: 'Flexibel',
    body:
      'Een artiest valt uit, een opbouw schuift, de weersvoorspelling verandert. Dat lossen we op zonder dat je er wakker van ligt.',
  },
  {
    n: '06',
    title: 'Eigen materiaal',
    body:
      'Eigen aggregaten, eigen line-arrays, eigen bus. Geen wachten op leveranciers, geen verrassingen op de opbouwdag.',
  },
]

const STATS = [
  { num: '2014', label: 'Sinds' },
  { num: '400+', label: 'Producties' },
  { num: '5000', label: 'Max bezoekers' },
  { num: '3', label: 'Vaste technici' },
]

export default function OverOnsPage() {
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
            <span>Over ons</span>
          </div>
          <h1>
            Een team dat al ruim tien jaar{' '}
            <span className="accent">evenementen op poten zet.</span>
          </h1>
          <p className="page-header__lead">
            Wittenboer Events is sinds 2014 actief in de regio &lsquo;s-Hertogenbosch. Een vaste
            kern crew, een netwerk van freelancers, eigen materiaal &mdash; en altijd dezelfde
            aanspreekpersoon van offerte tot opbouwdag.
          </p>
        </div>
      </header>

      <section className="about-intro">
        <div className="container about-intro__grid">
          <div className="about-intro__text" data-reveal>
            <p className="kicker">Het verhaal</p>
            <h2>Begonnen in 2014. Inmiddels een vaste crew.</h2>
            <p>
              Wittenboer Events begon in 2014 vanuit een schuur met de eerste set
              licht en geluid. Ruim tien jaar later draaien wij tussen de 60 en 80 producties per jaar
              &mdash; van bedrijfsborrels tot meerdaagse festivals met vijfduizend bezoekers.
            </p>
            <p>
              De vaste kern is klein: drie technici die elkaar door en door kennen, plus een
              netwerk van vaste freelancers waarmee we al jaren werken. Geen wisselende
              invalkrachten op je opbouwdag, geen onbekende gezichten achter de mengtafel. Wie
              je in de offerte ziet, staat er op de avond zelf.
            </p>
            <p>
              Wat ons onderscheidt is niet het materiaal &mdash; A-merk apparatuur is wat
              iedereen gebruikt. Wat ons onderscheidt is hoe we een evenement benaderen: als een
              puzzel die we voor je oplossen. We denken mee over locatie, omgeving en publiek.
              We rekenen geluidsbelasting door voordat de gemeente erom vraagt. We bellen de
              leverancier terug als een stekker niet klopt.
            </p>
            <p style={{ color: 'var(--color-fg)' }}>
              <strong>
                Je hoort ons pas als er iets is, en meestal is er dan al een oplossing.
              </strong>
            </p>
          </div>
          <div className="about-intro__portrait" data-reveal data-reveal-delay="2" data-img-zoom>
            <Image
              src="/photos/portrait-marnix.jpg"
              alt="Marnix Wittenboer op locatie"
              width={1200}
              height={1500}
              priority
            />
            <div className="about-intro__sig">
              <div className="about-intro__sig-name">Marnix Wittenboer</div>
              <div className="about-intro__sig-role">Oprichter · belt zelf op</div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats__grid" data-reveal-stagger>
            {STATS.map((s) => (
              <div key={s.label} className="stats__cell">
                <div className="stats__num">{s.num}</div>
                <div className="stats__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="why">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">Waarom Wittenboer</p>
              <h2>Zes redenen waarom opdrachtgevers ons bellen.</h2>
            </div>
            <p className="section-head__lead">
              Niet de slogans uit een offertemap. De concrete dingen waar opdrachtgevers ons om
              bellen sinds 2014.
            </p>
          </div>
          <div className="why__grid" data-reveal-stagger>
            {WHY.map((w) => (
              <div key={w.n} className="why-card hover-lift">
                <div className="why-card__num">{w.n}</div>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="container">
          <p className="kicker" style={{ marginBottom: 16 }}>Aan de slag</p>
          <h2>Klaar om mee te denken over je evenement?</h2>
          <div className="closing__ctas">
            <Link className="btn-primary" href="/contact">Neem contact op</Link>
            <Link className="btn-ghost" href="/aanbod">Bekijk het aanbod</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
