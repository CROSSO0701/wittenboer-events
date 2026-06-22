import type { Metadata, Viewport } from 'next'
import { PortalLayoutClient } from './_components/PortalLayoutClient'
import { RegisterSW } from './_components/RegisterSW'

// Maakt de portal installeerbaar als app op de telefoon.
// iOS leest deze apple-* tags; Android/Chrome gebruiken het manifest + de service worker.
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    title: 'Wittenboer',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#157A8C',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RegisterSW />
      <PortalLayoutClient>{children}</PortalLayoutClient>
    </>
  )
}
