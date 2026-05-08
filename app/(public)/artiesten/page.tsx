import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Artiesten',
  description:
    'Vast boekingsnetwerk: Jan Biggel, Ferry de Lits, Lars Brans en meer. Wij verzorgen tape-show, techniek en begeleiding.',
}

const ARTISTS = [
  {
    name: 'Jan Biggel',
    photo: '/photos/artist-jan-biggel.jpg',
    blurb:
      "Bekend door zijn unieke geluid en enthousiaste optredens. 2020-hits \"Fleske d'rin Fleske d'r\" en \"Ons Moeder Zeej Nog\".",
    href: 'https://www.janbiggel.nl',
  },
  {
    name: 'Ferry de Lits',
    photo: '/photos/artist-ferry-de-lits.jpg',
    blurb:
      'Meerdere chart-hits, samenwerkingen met Django Wagner. Debuutalbum "Ritme Van De Nacht".',
    href: 'https://www.ferrydelits.nl',
  },
  {
    name: 'Lars Brans',
    photo: '/photos/artist-mo-de-show.jpg',
    blurb:
      'Sinds 2020 actief, met radio-hits als "Wil Je Met Me Dansen" en "Mijn Schat".',
    href: 'https://www.deaprodukties.nl/boeken/lars-brans/',
  },
  {
    name: 'Evert van Huigevoort',
    photo: '/photos/artist-evert.jpg',
    blurb:
      'Een van de meest veelbelovende zangers in Nederland. Samenwerking op "Al Mijn Maten" met Wesley Klein en Roy Donders.',
    href: 'https://www.casperjanssenmusicpromotion.nl/artiesten/evert-van-huygevoort/',
  },
  {
    name: 'Jeffrey Lake',
    photo: '/photos/artist-jeffrey.jpg',
    blurb:
      'Werkt met Rood-Hit-Blauw, optredens naast Django Wagner en Wesley Klein. Single "With Christmas".',
    href: 'https://www.jeffreylake.nl',
  },
  {
    name: 'Brian More',
    photo: '/photos/artist-brian-more.jpg',
    blurb:
      'Energieke performer. Engels en Nederlands, van ballades tot dance. "In De Nacht", "Schuil dan maar bij mij".',
    href: 'https://www.brianmore.nl',
  },
  {
    name: 'Mo de Show',
    photo: '/photos/artist-mo-de-show.jpg',
    blurb:
      'Veelzijdig entertainer met Nederlandse volksmuziek-stijl. Optredens vanaf de jeugd.',
    href: 'https://www.rjbookings.nl/artiesten/zangers/zanger-mo-de-show/',
  },
  {
    name: 'Dirk Drost',
    photo: '/photos/artist-jeffrey.jpg',
    blurb:
      'Debuut "Ik Hou Van Jou" (2015), getekend bij Limbo-Power. Bekend van "Oranje Kampioen".',
    href: 'https://www.dirkdrost.nl',
  },
]

export default function ArtiestenPage() {
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
            <span>Artiesten</span>
          </div>
          <h1>
            De namen <span className="accent">die we draaien.</span>
          </h1>
          <p className="page-header__lead">
            We werken samen met een vaste groep Nederlandse artiesten &mdash; we kennen hun show,
            hun tapes, hun rider. Boekingen lopen via de artiest zelf; wij regelen de techniek
            en begeleiding.
          </p>
        </div>
      </header>

      <section className="roster">
        <div className="container">
          <div className="roster__intro" data-reveal>
            <p className="kicker">Onze artiesten</p>
            <p>
              De artiesten hieronder zijn we vertrouwd mee. Voor de meeste verzorgen we ook de
              tape-show en de begeleiding op locatie. Klik op de boeking-link om direct contact
              op te nemen met de artiest of hun management.
            </p>
          </div>

          <div className="roster__grid" data-reveal-stagger>
            {ARTISTS.map((a) => (
              <div key={a.name} className="artist">
                <div className="artist__photo">
                  <Image src={a.photo} alt={a.name} width={600} height={800} />
                </div>
                <div className="artist__name">{a.name}</div>
                <p className="artist__blurb">{a.blurb}</p>
                <a className="artist__link" href={a.href} target="_blank" rel="noopener noreferrer">
                  Boekingsinfo →
                </a>
              </div>
            ))}
          </div>

          <div className="booking-note" data-reveal>
            <div>
              <h3>Hoe werkt boeken?</h3>
              <p>
                De artiesten boek je rechtstreeks via hun eigen kanalen. Wij zorgen voor de
                tape-show, technische begeleiding en backstage-coördinatie als je dat wilt. Bel
                ons als je wilt sparren over een line-up of een combinatie van artiesten op één
                avond &mdash; we kennen de meeste werkschema&apos;s.
              </p>
            </div>
            <Link className="btn-primary" href="/contact">Bespreek een line-up</Link>
          </div>
        </div>
      </section>

      <section className="closing" style={{ background: 'var(--color-surface-1)' }}>
        <div className="container">
          <p className="kicker" style={{ marginBottom: 16 }}>Niet de juiste artiest gevonden?</p>
          <h2>We kennen er meer dan op deze pagina staan.</h2>
          <p style={{ margin: '0 auto 32px', maxInlineSize: '52ch', fontSize: 17 }}>
            Vraag het rustig. Voor de meeste Nederlandse zangers en bands hebben we de
            tape-arrangementen of de contacten direct beschikbaar.
          </p>
          <div className="closing__ctas">
            <a className="btn-primary" href="tel:+31627172876">Bel 06 27 17 28 76</a>
          </div>
        </div>
      </section>
    </main>
  )
}
