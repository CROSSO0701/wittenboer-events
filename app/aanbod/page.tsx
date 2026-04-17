import type { Metadata } from 'next'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { ServiceGrid } from '../components/services/ServiceGrid'
import { ContactCTA } from '../components/home/ContactCTA'

export const metadata: Metadata = {
  title: 'Aanbod',
  description:
    'Zes diensten onder één dak: geluid, licht, tapeshows, stroomvoorziening, artiestenbegeleiding en productiebegeleiding.',
}

export default function AanbodPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 md:pt-40 pb-16 md:pb-24">
          <div className="container-inset">
            <div className="mb-14 md:mb-16 max-w-3xl">
              <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
                Aanbod
              </p>
              <h1
                className="max-w-[14ch] mb-6"
                style={{ fontSize: 'clamp(3rem, 2rem + 5vw, 7rem)', lineHeight: 0.92 }}
              >
                Alles voor jouw evenement.
              </h1>
              <p
                className="text-[17px] md:text-[19px]"
                style={{ color: 'var(--color-fg-secondary)', maxInlineSize: '52ch', lineHeight: 1.55 }}
              >
                Zes diensten die los staan, maar sterker zijn samen. Kies wat je nodig hebt,
                of laat ons het hele plaatje doen.
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
