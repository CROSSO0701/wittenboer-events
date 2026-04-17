import type { Metadata } from 'next'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { ArtistGrid } from '../components/artists/ArtistGrid'
import { ContactCTA } from '../components/home/ContactCTA'

export const metadata: Metadata = {
  title: 'Artiesten',
  description:
    'Vast boekingsnetwerk: Jan Biggel, Ferry de Lits, Lars Brans en meer. Wij boeken, begeleiden en verzorgen de techniek — alles onder één aanspreekpunt.',
}

export default function ArtiestenPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-24 md:pt-32 pb-16 md:pb-20">
          <div className="container-inset">
            <div className="mb-14 max-w-3xl">
              <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
                Artiesten
              </p>
              <h1 className="max-w-[20ch] mb-6">Vast netwerk, persoonlijk geboekt.</h1>
              <p
                className="text-[var(--text-lg)]"
                style={{ color: 'var(--color-fg-secondary)', maxInlineSize: 'var(--measure-lead)' }}
              >
                Een selectie artiesten waarmee we regelmatig werken. Van feestelijke live-acts
                tot radiozangers — altijd geboekt met passende techniek en backstage-coördinatie.
                Klik door voor de officiële boekingspagina van de artiest.
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
