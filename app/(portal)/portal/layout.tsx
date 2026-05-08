'use client'

import { usePathname } from 'next/navigation'
import { PortalShell } from './_components/PortalShell'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
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
