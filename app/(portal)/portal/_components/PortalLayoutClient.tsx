'use client'

import { usePathname } from 'next/navigation'
import { PortalShell } from './PortalShell'

// Client-deel van de portal-layout: kiest tussen de "bare" login-weergave en
// de volledige shell. Afgesplitst zodat de layout zelf een server component kan
// blijven en metadata (manifest, Apple-installatie) kan exporteren.
export function PortalLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Login + OAuth callback pages krijgen GEEN shell
  const bare = pathname === '/portal/login'
  if (bare) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-12">
        {children}
      </main>
    )
  }
  return <PortalShell>{children}</PortalShell>
}
