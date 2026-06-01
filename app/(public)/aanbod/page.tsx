import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aanbod',
  description:
    'Zes diensten onder één dak: geluid, licht, stroom, artiesten, showpakketten en productiebegeleiding.',
}

const ARROW_NE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
)

export default function AanbodPage() {
  return (
    <main>
      <header className="page-header">
        <div className="container page-header__inner" data-reveal-stagger>
          <div className="page-header__crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Aanbod</span>
          </div>
          <h1>
            Voor ieder evenement <span className="accent">een passende oplossing.</span>
          </h1>
          <p className="page-header__lead">
            Geluid, licht, stroom, artiesten, productie. Los te boeken of compleet uit handen.
            Zes diensten, één aanspreekpunt.
          </p>
        </div>
      </header>

      <section className="aanbod">
        <div className="container">
          <div className="aanbod__intro" data-reveal>
            <p className="kicker">Wat wij doen</p>
            <p>
              Wij werken met A-merk materiaal en sturen onze eigen technici aan. Of u nu één
              microfoon nodig hebt voor een toespraak, of een complete festivalproductie.
              Onderstaande diensten kunt u los boeken of als pakket. Klik op een kaart voor
              de details.
            </p>
          </div>

          <div className="aanbod__grid" data-reveal-stagger>
            <Link className="a-card a-card--photo a-card--geluid" href="/aanbod/geluid">
              <div className="a-card__photo" style={{ backgroundImage: "url('/photos/studio-023.jpg')" }} />
              <div className="a-card__inner">
                <div className="a-card__num">01 / Audio</div>
                <div>
                  <h3>Geluid</h3>
                  <p>
                    Goed geluid op een kantoorfeestje of een festival met 5000 bezoekers. Wij
                    regelen beide. Line-arrays, mixers, monitoring, microfoontechniek.
                  </p>
                </div>
                <div className="a-card__foot">
                  <span className="a-card__cta">Bekijk details</span>
                  <span className="a-card__arrow">{ARROW_NE}</span>
                </div>
              </div>
            </Link>

            <Link className="a-card a-card--photo a-card--licht" href="/aanbod/licht">
              <div className="a-card__photo" style={{ backgroundImage: "url('/photos/park-lounge-2.jpg')" }} />
              <div className="a-card__inner">
                <div className="a-card__num">02 / Visueel</div>
                <div>
                  <h3>Licht</h3>
                  <p>Een goede belichting bepaalt de hele sfeer. Van intiem diner tot festivalpodium.</p>
                </div>
                <div className="a-card__foot">
                  <span className="a-card__cta">Bekijk details</span>
                  <span className="a-card__arrow">{ARROW_NE}</span>
                </div>
              </div>
            </Link>

            <Link className="a-card a-card--flat a-card--stroom" href="/aanbod/stroomvoorziening">
              <div className="a-card__inner">
                <div className="a-card__num">03 / Infrastructuur</div>
                <div>
                  <h3>Stroomvoorziening</h3>
                  <p>
                    Aggregaten, verdeelkasten, kabels. Belastingsberekening vooraf, redundante
                    failover voor hoofdpodia.
                  </p>
                </div>
                <div className="a-card__foot">
                  <span className="a-card__cta" style={{ color: 'var(--color-primary)' }}>Bekijk details</span>
                  <span className="a-card__arrow">{ARROW_NE}</span>
                </div>
              </div>
            </Link>

            <Link className="a-card a-card--flat a-card--artiesten" href="/aanbod/artiestenbegeleiding">
              <div className="a-card__inner">
                <div className="a-card__num">04 / Backstage &amp; tapes</div>
                <div>
                  <h3>Artiesten</h3>
                  <p>
                    Boekingsadvies, tape-begeleiding en backstage-coördinatie. Wij kennen de
                    repertoires van de meeste Nederlandse zangers.
                  </p>
                </div>
                <div className="a-card__foot">
                  <span className="a-card__cta" style={{ color: 'var(--color-primary)' }}>Bekijk details</span>
                  <span className="a-card__arrow">{ARROW_NE}</span>
                </div>
              </div>
            </Link>

            <Link className="a-card a-card--pakketten" href="/show-pakketten">
              <div className="a-card__inner">
                <div className="a-card__photo-side" style={{ backgroundImage: "url('/photos/event-5.jpg')" }} />
                <div className="a-card__txt-side">
                  <div>
                    <div className="a-card__num">Kant-en-klaar</div>
                    <h3 style={{ marginTop: 8 }}>Showpakketten</h3>
                    <p style={{ marginTop: 14 }}>
                      Vier vaste setups voor bruiloften, jubilea en privéfeesten. Wij brengen,
                      bouwen op, draaien, breken af. Eén prijs. Geen verrassingen.
                    </p>
                  </div>
                  <div className="a-card__pkg-list">
                    <span>Compact</span>
                    <span>Booth</span>
                    <span>Truss Show</span>
                    <span>Show Wit</span>
                  </div>
                  <div className="a-card__foot">
                    <span className="a-card__price-tag">
                      Vanaf <strong>€495</strong>
                    </span>
                    <span className="a-card__arrow" style={{ color: 'var(--color-tertiary)' }}>{ARROW_NE}</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              className="a-card a-card--flat a-card--productie"
              href="/aanbod/productiebegeleiding"
              style={{ background: 'var(--color-tertiary-soft)', borderColor: 'var(--color-tertiary)' }}
            >
              <div className="a-card__inner" style={{ gap: 32 }}>
                <div>
                  <div className="a-card__num">05 / End-to-end</div>
                  <h3 style={{ marginTop: 8 }}>Productiebegeleiding</h3>
                </div>
                <p style={{ fontSize: 16 }}>
                  Wilt u één aanspreekpunt voor uw hele evenement? Locatie-inspectie,
                  vergunningenadvies, leveranciers, planning, techniek, artiesten en
                  crewmanagement. U hoeft alleen te genieten.
                </p>
                <div
                  className="a-card__foot"
                  style={{ flex: '0 0 auto', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}
                >
                  <span className="a-card__cta" style={{ color: 'var(--color-primary)' }}>Bekijk details</span>
                  <span className="a-card__arrow">{ARROW_NE}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="closing" style={{ background: 'var(--color-surface-1)' }}>
        <div className="container">
          <p className="kicker" style={{ marginBottom: 16 }}>Niet zeker wat u nodig hebt?</p>
          <h2>Bel ons en wij denken mee.</h2>
          <p style={{ margin: '0 auto 32px', maxInlineSize: '52ch', fontSize: 17 }}>
            Een korte belronde, een locatie-inspectie als dat nuttig is, en een plan dat past bij
            wat u écht zoekt.
          </p>
          <div className="closing__ctas">
            <Link className="btn-primary" href="/contact">Neem contact op</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
