import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import ScrollEffects from '../components/shared/ScrollEffects'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Naar inhoud</a>
      <div className="scroll-progress" aria-hidden>
        <div className="scroll-progress__bar" />
      </div>
      <Nav />
      <div id="main" tabIndex={-1}>
        {children}
      </div>
      <Footer />
      <ScrollEffects />
    </>
  )
}
