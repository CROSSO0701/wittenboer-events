import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import ScrollEffects from '../components/shared/ScrollEffects'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="scroll-progress" aria-hidden>
        <div className="scroll-progress__bar" />
      </div>
      <Nav />
      {children}
      <Footer />
      <ScrollEffects />
    </>
  )
}
