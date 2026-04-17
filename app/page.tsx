import { Nav } from './components/layout/Nav'
import { Footer } from './components/layout/Footer'
import { Hero } from './components/home/Hero'
import { TrustedBy } from './components/home/TrustedBy'
import { ServicesPreview } from './components/home/ServicesPreview'
import { ApproachStrip } from './components/home/ApproachStrip'
import { FeaturedWork } from './components/home/FeaturedWork'
import { ArtistsTeaser } from './components/home/ArtistsTeaser'
import { EquipmentStrip } from './components/home/EquipmentStrip'
import { ContactCTA } from './components/home/ContactCTA'

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustedBy />
        <ServicesPreview />
        <ApproachStrip />
        <FeaturedWork />
        <ArtistsTeaser />
        <EquipmentStrip />
        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}
