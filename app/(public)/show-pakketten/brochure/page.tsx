import type { Metadata } from 'next'
import Image from 'next/image'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { BrochureAutoPrint } from './BrochureAutoPrint'

export const metadata: Metadata = {
  title: 'Brochure showpakketten',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Pkg = {
  slug: string
  name: string
  tagline: string | null
  description: string | null
  price_from_cents: number
  guest_capacity_min: number | null
  guest_capacity_max: number | null
  features: unknown
  is_popular: boolean
  display_order: number
}

const FALLBACK_PKGS: Pkg[] = [
  {
    slug: 'compact',
    name: 'Compact',
    tagline: 'Instap-pakket',
    description: 'Voor verjaardagen en kleinere zalen tot ±80 gasten.',
    price_from_cents: 49500,
    guest_capacity_min: 20,
    guest_capacity_max: 80,
    features: ['1× DJ-meubel truss met LED parren', '1× 4-bar lichtbar', '1× Pioneer-set (CDJ + mixer)'],
    is_popular: false,
    display_order: 1,
  },
  {
    slug: 'booth',
    name: 'Booth',
    tagline: 'Compleet pakket',
    description: 'Strak DJ-booth met d&b geluid. Tot ±150 gasten.',
    price_from_cents: 59500,
    guest_capacity_min: 50,
    guest_capacity_max: 150,
    features: [
      '2× 4-bar lichtbar',
      '1× DJ-booth met 4 LED parren',
      '1× Pioneer-set (CDJ + mixer)',
      '1× booth-monitor',
      '1× set d&b audio',
    ],
    is_popular: false,
    display_order: 2,
  },
  {
    slug: 'truss-show',
    name: 'Truss Show',
    tagline: 'Populairste',
    description: 'De full-show. Tot ±250 gasten.',
    price_from_cents: 69500,
    guest_capacity_min: 100,
    guest_capacity_max: 250,
    features: [
      '4× truss-paal met LED par + moving head',
      '1× truss-booth met LED parren',
      '1× DJ-set (CDJ + mixer)',
      '1× monitor',
      '1× Pioneer-set',
    ],
    is_popular: true,
    display_order: 3,
  },
  {
    slug: 'show-wit',
    name: 'Show Wit',
    tagline: 'Premium · wit',
    description: 'Bruiloften en chique gala-avonden. Witte uitstraling.',
    price_from_cents: 79500,
    guest_capacity_min: 100,
    guest_capacity_max: 300,
    features: [
      '4× truss-paal met witte slave',
      '4× moving head',
      '4× LED par',
      '1× DJ-booth wit',
      '1× set d&b audio',
      '1× Pioneer-set',
      '1× booth-monitor',
    ],
    is_popular: false,
    display_order: 4,
  },
]

async function loadPackages(): Promise<Pkg[]> {
  try {
    const supabase = createSupabaseAdminClient()
    const { data } = await supabase
      .from('disco_packages')
      .select('slug, name, tagline, description, price_from_cents, guest_capacity_min, guest_capacity_max, features, is_popular, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true })
    if (data && data.length > 0) return data as Pkg[]
  } catch {
    // fall through
  }
  return FALLBACK_PKGS
}

function fmtEUR(cents: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export default async function BrochurePage({
  searchParams,
}: {
  searchParams: Promise<{ print?: string }>
}) {
  const { print } = await searchParams
  const autoPrint = print === '1' || print === 'true'
  const packages = await loadPackages()

  return (
    <main className="brochure-root">
      {autoPrint && <BrochureAutoPrint />}
      <BrochureStyles />

      {/* Cover */}
      <section className="page cover">
        <header>
          <Image
            src="/logo/we-mark.png"
            alt="Wittenboer Events"
            width={180}
            height={180}
            priority
            style={{ width: 90, height: 'auto' }}
          />
          <p className="kicker">Showpakketten · brochure</p>
          <h1>Vier shows, één telefoontje.</h1>
          <p className="lead">
            Kant-en-klare licht- en geluidsproducties voor bruiloften, jubilea, verjaardagen en
            bedrijfsfeesten. Wij brengen, bouwen op, draaien de show, breken af.
          </p>
        </header>
        <footer className="cover-foot">
          <div>
            <strong>Wittenboer Events</strong>
            <br />
            Het Schild 35, 5275 EE Den Dungen
          </div>
          <div>
            06 27 17 28 76
            <br />
            info@wittenboerevents.nl
          </div>
          <div>
            wittenboerevents.nl
            <br />
            KVK 65834921
          </div>
        </footer>
      </section>

      {/* Packages */}
      {packages.map((p, idx) => {
        const features = Array.isArray(p.features) ? (p.features as string[]) : []
        return (
          <section className="page pkg" key={p.slug}>
            <div className="pkg-num">{String(idx + 1).padStart(2, '0')}</div>
            <header className="pkg-head">
              <p className="kicker">{p.tagline ?? 'Pakket'}</p>
              <h2>{p.name}</h2>
              {p.is_popular && <span className="badge">Populairste</span>}
            </header>
            <p className="pkg-desc">{p.description}</p>
            <div className="pkg-meta">
              <div>
                <span>Prijs</span>
                <strong>vanaf {fmtEUR(p.price_from_cents)}</strong>
              </div>
              <div>
                <span>Gasten</span>
                <strong>
                  {p.guest_capacity_min ?? '-'}–{p.guest_capacity_max ?? '-'}
                </strong>
              </div>
            </div>
            <h3>Inbegrepen</h3>
            <ul className="features">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )
      })}

      {/* Closing */}
      <section className="page closing">
        <h2>Wat zit er standaard bij elk pakket?</h2>
        <ul className="features">
          <li>
            <strong>Transport.</strong> Wij brengen alles in onze eigen bus. Aanrijden vanuit
            &lsquo;s-Hertogenbosch e.o. binnen 50 km gratis.
          </li>
          <li>
            <strong>Opbouw &amp; afbouw.</strong> Twee technici komen 2–4 uur voor aanvang. Na
            afloop alles weer mee.
          </li>
          <li>
            <strong>Programmering.</strong> Lichtshow vooraf geprogrammeerd, op de avond zelf
            iemand achter de console.
          </li>
          <li>
            <strong>Aanspreekpunt.</strong> Eén nummer voor de hele avond.
          </li>
        </ul>
        <h2 className="cta-h">Reserveer een pakket</h2>
        <p>
          Stuur een korte aanvraag (datum, locatie, welk pakket) en wij sturen binnen één
          werkdag een offerte met vaste prijs.
        </p>
        <p className="big">
          06 27 17 28 76 · info@wittenboerevents.nl · wittenboerevents.nl
        </p>
      </section>
    </main>
  )
}

function BrochureStyles() {
  return (
    <style>{`
      .nav, .footer, .scroll-progress { display: none !important; }
      body { background: #FFFFFF !important; }
      .brochure-root{ background:#FFFFFF; color:#1E2A2F; font-family: 'Figtree', system-ui, sans-serif; }
      .brochure-root .page{ max-width:760px; margin:0 auto; padding:64px 56px; min-height:100vh; box-sizing:border-box; }
      .brochure-root .cover{ display:flex; flex-direction:column; justify-content:space-between; min-height:100vh; }
      .brochure-root .kicker{ color:#157A8C; font-size:13px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; margin:24px 0 8px; }
      .brochure-root h1{ font-family:'Anton', Impact, sans-serif; font-size:64px; line-height:1.05; text-transform:uppercase; margin:0; color:#1E2A2F; }
      .brochure-root h2{ font-family:'Anton', Impact, sans-serif; font-size:48px; line-height:1.05; text-transform:uppercase; margin:0 0 16px; color:#1E2A2F; }
      .brochure-root h3{ font-size:13px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#636466; margin:24px 0 12px; }
      .brochure-root .lead{ font-size:18px; line-height:1.55; max-width:60ch; color:#3E3F42; margin-top:16px; }
      .brochure-root .cover-foot{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; font-size:13px; color:#3E3F42; border-top:1px solid #DCDEE0; padding-top:24px; }
      .brochure-root .pkg{ position:relative; }
      .brochure-root .pkg-num{ position:absolute; top:48px; right:56px; font-family:'Anton', Impact, sans-serif; font-size:96px; line-height:1; color:#D9C5B2; opacity:0.5; }
      .brochure-root .pkg-head{ position:relative; }
      .brochure-root .pkg-head .badge{ display:inline-block; margin-top:12px; padding:4px 12px; border-radius:999px; background:#157A8C; color:white; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; }
      .brochure-root .pkg-desc{ margin-top:16px; font-size:16px; line-height:1.6; max-width:56ch; color:#3E3F42; }
      .brochure-root .pkg-meta{ display:flex; gap:48px; margin:32px 0; padding:16px 0; border-top:1px solid #DCDEE0; border-bottom:1px solid #DCDEE0; }
      .brochure-root .pkg-meta div{ display:flex; flex-direction:column; }
      .brochure-root .pkg-meta span{ font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#636466; }
      .brochure-root .pkg-meta strong{ font-family:'Anton', Impact, sans-serif; font-size:24px; margin-top:4px; color:#1E2A2F; }
      .brochure-root .features{ list-style:none; padding:0; margin:0; }
      .brochure-root .features li{ padding:10px 0; border-top:1px solid #EDEEEF; font-size:14px; line-height:1.5; color:#1E2A2F; position:relative; padding-left:18px; }
      .brochure-root .features li:first-child{ border-top:none; }
      .brochure-root .features li::before{ content:""; position:absolute; left:0; top:18px; width:6px; height:6px; border-radius:999px; background:#157A8C; }
      .brochure-root .closing .cta-h{ margin-top:40px; }
      .brochure-root .big{ font-family:'Anton', Impact, sans-serif; font-size:24px; margin-top:24px; color:#157A8C; }
      @media print{
        @page{ size: A4; margin: 16mm; }
        .brochure-root .page{ page-break-after: always; min-height: 0; padding:0; }
        .brochure-root .page:last-child{ page-break-after: auto; }
      }
    `}</style>
  )
}
