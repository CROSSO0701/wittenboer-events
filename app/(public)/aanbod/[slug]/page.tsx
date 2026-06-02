import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

type Service = {
  slug: string
  num: string
  cat: string
  kicker: string
  title: string
  lead: string
  body: string
  bullets: string[]
  photo?: string
  ctaLabel: string
  ctaHref: string
  dark?: boolean
}

const SERVICES: Service[] = [
  {
    slug: 'geluid',
    num: '01',
    cat: 'Audio',
    kicker: 'Geluid',
    title: 'Een systeem dat past bij de locatie.',
    lead: 'Goed geluid op een kantoorfeestje of een festival met 5000 bezoekers. Wij regelen beide.',
    body: 'Wij verzorgen het complete audiosysteem. Van line-arrays en subs tot microfoontechniek en monitoring. Elk evenement krijgt een systeem dat bij de locatie past, met een geluidstechnicus die de show live mixt. Akoestisch uitdagende locaties? Wij rekenen het door en stellen een oplossing voor waarbij omgeving én publiek worden ontzien.',
    bullets: [
      'Line-arrays en point-source systemen (A-merk: L-Acoustics, d&b, RCF)',
      'Digitale mixers met multi-track opname',
      'In-ear monitoring en wedge-monitoring',
      'Meet- en richtmicrofoons voor klachtgevoelige locaties',
    ],
    photo: '/photos/studio-023.jpg',
    ctaLabel: 'Vraag een offerte',
    ctaHref: '/contact',
  },
  {
    slug: 'licht',
    num: '02',
    cat: 'Visueel',
    kicker: 'Licht',
    title: 'Een lichtontwerp dat de show maakt.',
    lead: 'Een goede belichting bepaalt de hele sfeer van je evenement.',
    body: 'Van een intiem bedrijfsdiner tot een compleet festivalpodium. Wij ontwerpen het lichtplan, bouwen het op en programmeren de show. Wij werken met A-merk fixtures, moving heads en architecturale armaturen. Een van onze technici staat altijd aan de console om de show live te operaten.',
    bullets: [
      'Volledig lichtontwerp op maat',
      'Moving heads, LED-wash, beams en architecturale verlichting',
      'Programmeerbare consoles (grandMA, Hog)',
      'Synchronisatie met video en geluid',
    ],
    photo: '/photos/park-lounge-2.jpg',
    ctaLabel: 'Vraag een offerte',
    ctaHref: '/contact',
  },
  {
    slug: 'stroomvoorziening',
    num: '03',
    cat: 'Infrastructuur',
    kicker: 'Stroomvoorziening',
    title: 'Het netwerk onder de show.',
    lead: 'Tijdelijke stroomvoorziening voor festivals, beurzen en bedrijfsevenementen.',
    body: 'Wij leveren aggregaten, verdeelkasten, kabels en aansluitingen op maat. Voor kleine tuinfeesten tot grote festivalterreinen. Een van onze technici maakt vooraf de belastingsberekening en zorgt dat het op de dag probleemloos draait. Inclusief redundante failover voor hoofdpodia.',
    bullets: [
      'Stille, EU-5 aggregaten (25kVA tot 500kVA)',
      'Complete verdeelkasten met CEE-aansluitingen',
      'Belastingsberekening en enkele/drie-fase verdeling',
      'Failover-opstellingen voor hoofdpodia',
    ],
    ctaLabel: 'Vraag een offerte',
    ctaHref: '/contact',
  },
  {
    slug: 'artiestenbegeleiding',
    num: '04',
    cat: 'Backstage & tapes',
    kicker: 'Artiesten',
    title: 'Boekingsadvies, tapes en backstage in één hand.',
    lead: 'Van aankomst tot laatste encore. Plus de tape-show als de artiest die nodig heeft.',
    body: 'Wij werken al jaren met dezelfde groep Nederlandse zangers en kennen hun repertoires. Onze tape-operator staat naast de artiest op de bühne of in de techniek, afhankelijk van de wens. Wij zorgen voor tijdige aankomst, professionele backstage-faciliteiten, het programma en de aansluiting tussen artiest en techniek. Geen no-shows, geen chaos bij de wissels.',
    bullets: [
      'Tape-begeleiding voor de meeste Nederlandse zangers',
      'Backstage-coördinatie en runner-rol',
      'Aansluiting tussen artiestenwissel en techniek',
      'Boekingsadvies en line-up sparring vooraf',
    ],
    ctaLabel: 'Bekijk artiesten',
    ctaHref: '/artiesten',
    dark: true,
  },
  {
    slug: 'productiebegeleiding',
    num: '05',
    cat: 'End-to-end',
    kicker: 'Productiebegeleiding',
    title: 'Eén aanspreekpunt voor het hele evenement.',
    lead: 'Van eerste gesprek tot en met de afbouw. End-to-end coördinatie.',
    body: 'Wil je één aanspreekpunt voor je hele evenement? We nemen de volledige productie uit handen. Van locatie-inspectie, vergunningenadvies, leveranciersselectie, planning, techniek, artiesten en crewmanagement tot evaluatie. Jij hoeft alleen te genieten.',
    bullets: [],
    ctaLabel: 'Plan een gesprek',
    ctaHref: '/contact',
  },
]

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return SERVICES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const service = SERVICES.find((s) => s.slug === slug)
  if (!service) return { title: 'Niet gevonden' }
  return { title: service.kicker, description: service.lead }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const idx = SERVICES.findIndex((s) => s.slug === slug)
  if (idx === -1) notFound()
  const svc = SERVICES[idx]
  const prev = idx > 0 ? SERVICES[idx - 1] : null
  const next = idx < SERVICES.length - 1 ? SERVICES[idx + 1] : null

  return (
    <main>
      <header className="page-header">
        <div className="container page-header__inner" data-reveal-stagger>
          <div className="page-header__crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/aanbod">Aanbod</Link>
            <span>/</span>
            <span>{svc.kicker}</span>
          </div>
          <h1>
            {svc.kicker.toUpperCase()} <span className="accent">· {svc.title.toLowerCase()}</span>
          </h1>
          <p className="page-header__lead">{svc.lead}</p>
        </div>
      </header>

      <section className={`svc${svc.dark ? ' svc--dark' : ''}`}>
        <div className="container svc__grid">
          <div className="svc__num" data-reveal>
            {svc.num}
            <small>{svc.cat}</small>
          </div>
          <div className="svc__body">
            <p
              className="kicker"
              style={svc.dark ? { color: 'var(--color-tertiary)' } : undefined}
              data-reveal
            >
              {svc.kicker}
            </p>
            <h2 data-reveal data-reveal-delay="1">{svc.title}</h2>
            <p className="lead" data-reveal data-reveal-delay="2">{svc.lead}</p>
            <p data-reveal data-reveal-delay="3">{svc.body}</p>
            {svc.bullets.length > 0 && (
              <ul className="svc__bullets" data-reveal-stagger>
                {svc.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {svc.photo && (
              <div className="svc__photo" data-img-zoom>
                <Image src={svc.photo} alt="" width={1600} height={900} />
              </div>
            )}
            <div className="svc__cta-row">
              <Link className="btn-primary" href={svc.ctaHref}>{svc.ctaLabel}</Link>
            </div>

            <div className="svc__nav">
              {prev ? (
                <Link href={`/aanbod/${prev.slug}`} className="svc__nav-prev">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                  Vorige: {prev.kicker}
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/aanbod/${next.slug}`}>
                  Volgende: {next.kicker}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : <span />}
            </div>
          </div>
        </div>
      </section>

      <section className="closing" style={{ background: 'var(--color-surface-dark)', color: 'var(--color-fg-on-dark)' }}>
        <div className="container">
          <p className="kicker" style={{ color: 'var(--color-tertiary)', marginBottom: 16 }}>
            Vragen?
          </p>
          <h2 style={{ color: 'var(--color-fg-on-dark)' }}>Liever even bellen?</h2>
          <p style={{ color: 'var(--color-fg-on-dark-muted)', margin: '0 auto 32px', maxInlineSize: '52ch', fontSize: 17 }}>
            Een korte belronde geeft vaak meer duidelijkheid dan een formulier. Wij nemen meestal
            binnen een paar uur op.
          </p>
          <div className="closing__ctas">
            <a className="btn-primary" href="tel:+31627172876">Bel 06 27 17 28 76</a>
          </div>
        </div>
      </section>
    </main>
  )
}
