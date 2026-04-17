import type { Metadata } from 'next'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { ArtistGrid } from '../components/artists/ArtistGrid'
import { ContactCTA } from '../components/home/ContactCTA'

export const metadata: Metadata = {
  title: 'Artiesten',
  description:
    'Vast boekingsnetwerk: Jan Biggel, Ferry de Lits, Lars Brans en meer. Wij boeken, begeleiden en verzorgen de techniek onder één aanspreekpunt.',
}

export default function ArtiestenPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 md:pt-40 pb-16 md:pb-20">
          <div className="container-inset">
            <div className="mb-14 md:mb-16 max-w-3xl">
              <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
                Artiesten
              </p>
              <h1
                className="max-w-[16ch] mb-6"
                style={{ fontSize: 'clamp(3rem, 2rem + 5vw, 7rem)', lineHeight: 1.05 }}
              >
                Wij boeken, wij kennen ze.
              </h1>
              <p
                className="text-[17px] md:text-[19px]"
                style={{ color: 'var(--color-fg-secondary)', maxInlineSize: '52ch', lineHeight: 1.55 }}
              >
                Een vast netwerk van Nederlandse zangers waarmee we regelmatig werken. Van live-acts tot radiozangers,
                geboekt met passende techniek en backstage-coördinatie. Klik door voor de officiële boekingspagina.
              </p>
            </div>

            <ArtistGrid />
          </div>
        </section>

        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}
