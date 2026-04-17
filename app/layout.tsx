import type { Metadata } from 'next'
import { Anton, Figtree, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
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
    'Van drive-in show tot volledige productie. Licht, geluid, stroom en artiesten — door Marnix Wittenboer in Sint-Michielsgestel.',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    title: 'Wittenboer Events',
    description: 'Licht, geluid, stroom en artiesten voor evenementen van elke schaal.',
    siteName: 'Wittenboer Events',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${anton.variable} ${figtree.variable} ${jetbrains.variable}`}>
      <body style={{ fontFamily: 'var(--font-body)' }}>{children}</body>
    </html>
  )
}
