import type { Metadata } from 'next'
import { PortalToaster } from './portal/_components/PortalToaster'

export const metadata: Metadata = {
  title: { default: 'Portal · Wittenboer', template: '%s · Portal' },
  robots: { index: false, follow: false },
}

export default function PortalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Naar inhoud</a>
      <div id="main" tabIndex={-1} className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-fg)]">
        {children}
        <PortalToaster />
      </div>
    </>
  )
}
