import { Nav } from './components/layout/Nav'
import { Footer } from './components/layout/Footer'
import { Hero } from './components/home/Hero'
import { TrustedBy } from './components/home/TrustedBy'
import { ServicesPreview } from './components/home/ServicesPreview'
import { FeaturedWork } from './components/home/FeaturedWork'
import { ArtistsTeaser } from './components/home/ArtistsTeaser'
import { ApproachStrip } from './components/home/ApproachStrip'
import { ContactCTA } from './components/home/ContactCTA'

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        {/* Rhythm: dark → light → light → dark → light → light → dark */}
        <Hero />
        <TrustedBy />
        <ServicesPreview />
        <FeaturedWork />
        <ArtistsTeaser />
        <ApproachStrip />
        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}
