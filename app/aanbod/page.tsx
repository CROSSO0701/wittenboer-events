import type { Metadata } from 'next'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { ServiceGrid } from '../components/services/ServiceGrid'
import { ContactCTA } from '../components/home/ContactCTA'

export const metadata: Metadata = {
  title: 'Aanbod',
  description:
    'Zes diensten onder één dak: geluid, licht, tapeshows, stroomvoorziening, artiestenbegeleiding en productiebegeleiding. Compleet verzorgd door Wittenboer Events.',
}

export default function AanbodPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="container-inset">
            <div className="mb-14 max-w-3xl">
              <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
                Aanbod
              </p>
              <h1 className="max-w-[18ch] mb-6">Complete productie, zes bouwstenen.</h1>
              <p
                className="text-[var(--text-lg)]"
                style={{ color: 'var(--color-fg-secondary)', maxInlineSize: 'var(--measure-lead)' }}
              >
                Elke dienst kun je los afnemen, maar ze zijn ontworpen om samen te werken. Dat
                scheelt coördinatie, voorkomt gaten in het draaiboek en maakt de dag van het
                evenement rustiger voor iedereen.
              </p>
            </div>

            <ServiceGrid />
          </div>
        </section>

        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}
