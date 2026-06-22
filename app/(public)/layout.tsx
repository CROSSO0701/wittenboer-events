import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import WhatsAppButton from '../components/layout/WhatsAppButton'
import ScrollEffects from '../components/shared/ScrollEffects'
import { SpotlightCursor } from '../components/shared/SpotlightCursor'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SpotlightCursor tone="warm" />
      <a href="#main" className="skip-link">Naar inhoud</a>
      <div className="scroll-progress" aria-hidden>
        <div className="scroll-progress__bar" />
      </div>
      <Nav />
      <div id="main" tabIndex={-1}>
        {children}
      </div>
      <Footer />
      <WhatsAppButton />
      <ScrollEffects />
    </>
  )
}
