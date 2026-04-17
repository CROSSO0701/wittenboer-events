import type { Metadata } from 'next'
import { Fraunces, Figtree, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
})

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://wittenboerevents.nl'),
  title: {
    default: 'Wittenboer Events — licht, geluid en productie',
    template: '%s — Wittenboer Events',
  },
  description:
    'Van drive-in show tot volledige productie. Professioneel licht, geluid, stroomvoorziening en artiestenbegeleiding door Marnix Wittenboer. Gevestigd in Sint-Michielsgestel.',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    title: 'Wittenboer Events — licht, geluid en productie',
    description:
      'Professioneel licht, geluid, stroomvoorziening en artiestenbegeleiding. Van festival tot bedrijfsevenement.',
    siteName: 'Wittenboer Events',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${fraunces.variable} ${figtree.variable} ${jetbrains.variable}`}>
      <body style={{ fontFamily: 'var(--font-body)' }}>{children}</body>
    </html>
  )
}
