import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Artiesten',
  description:
    'Vast boekingsnetwerk: Jan Biggel, Mikey Wonder, Mo de Show en meer. Wij verzorgen tape-show, techniek en begeleiding.',
}

type Artist = { name: string; photo: string; blurb?: string; href?: string }

const ARTISTS: Artist[] = [
  { name: 'Mikey Wonder', photo: '/photos/artist-mikey-wonder.jpg' },
  {
    name: 'Jan Biggel',
    photo: '/photos/artist-jan-biggel.jpg',
    blurb:
      "Bekend door zijn unieke geluid en enthousiaste optredens. 2020-hits \"Fleske d'rin Fleske d'r\" en \"Ons Moeder Zeej Nog\".",
    href: 'https://www.janbiggel.nl',
  },
  {
    name: 'Mo de Show',
    photo: '/photos/artist-mo-de-show.jpg',
    blurb:
      'Veelzijdig entertainer met Nederlandse volksmuziek-stijl. Optredens vanaf de jeugd.',
    href: 'https://www.rjbookings.nl/artiesten/zangers/zanger-mo-de-show/',
  },
  { name: 'Frank van Weert', photo: '/photos/artist-frank-van-weert.jpg' },
  { name: 'Guus Doggen', photo: '/photos/artist-guus-doggen.jpg' },
  { name: 'Daymian van Oss', photo: '/photos/artist-daymian-van-oss.jpg' },
  { name: 'Mark van Veen', photo: '/photos/artist-mark-van-veen.jpg' },
  { name: "Mark's Hazes Tribute", photo: '/photos/artist-marks-hazes-tribute.webp' },
  { name: 'Remco Voets', photo: '/photos/artist-remco-voets.jpg' },
  { name: 'Rienie van de Kerkhof', photo: '/photos/artist-rienie-van-de-kerkhof.jpg' },
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
            De namen <span className="accent">die wij draaien.</span>
          </h1>
          <p className="page-header__lead">
            Wij werken samen met een vaste groep Nederlandse artiesten &mdash; wij kennen hun show,
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
              Met de artiesten hieronder werken wij vertrouwd samen. Voor de meeste verzorgen wij
              ook de tape-show en de begeleiding op locatie. Klik op de boekingslink om direct
              contact op te nemen met de artiest of hun management.
            </p>
          </div>

          <div className="roster__grid" data-reveal-stagger>
            {ARTISTS.map((a) => (
              <div key={a.name} className="artist">
                <div className="artist__photo">
                  <Image src={a.photo} alt={a.name} width={600} height={800} />
                </div>
                <div className="artist__name">{a.name}</div>
                {a.blurb && <p className="artist__blurb">{a.blurb}</p>}
                {a.href && (
                  <a className="artist__link" href={a.href} target="_blank" rel="noopener noreferrer">
                    Boekingsinfo →
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="booking-note" data-reveal>
            <div>
              <h3>Hoe werkt boeken?</h3>
              <p>
                De artiesten boekt u rechtstreeks via hun eigen kanalen. Wij zorgen voor de
                tape-show, technische begeleiding en backstage-coördinatie als u dat wilt. Bel
                ons als u wilt sparren over een line-up of een combinatie van artiesten op één
                avond &mdash; wij kennen de meeste werkschema&apos;s.
              </p>
            </div>
            <Link className="btn-primary" href="/contact">Bespreek een line-up</Link>
          </div>
        </div>
      </section>

      <section className="closing" style={{ background: 'var(--color-surface-1)' }}>
        <div className="container">
          <p className="kicker" style={{ marginBottom: 16 }}>Niet de juiste artiest gevonden?</p>
          <h2>Wij kennen er meer dan op deze pagina staan.</h2>
          <p style={{ margin: '0 auto 32px', maxInlineSize: '52ch', fontSize: 17 }}>
            Vraag het ons gerust. Voor de meeste Nederlandse zangers en bands hebben wij de
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
