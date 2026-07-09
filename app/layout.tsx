import type { Metadata } from 'next'
import { Anton, Figtree, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
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

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wittenboerevents.nl').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Wittenboer Events | licht, geluid en productie',
    template: '%s | Wittenboer Events',
  },
  description:
    'Van drive-in show tot volledige productie. Licht, geluid, stroom en artiesten door Marnix Wittenboer in Den Dungen.',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: SITE_URL,
    siteName: 'Wittenboer Events',
    title: 'Wittenboer Events',
    description: 'Licht, geluid, stroom en artiesten voor evenementen van elke schaal.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Wittenboer Events: licht, geluid en productie',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wittenboer Events',
    description: 'Licht, geluid, stroom en artiesten voor evenementen van elke schaal.',
    images: ['/og.jpg'],
  },
  robots: { index: true, follow: true },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#organization`,
  name: 'Wittenboer Events',
  url: SITE_URL,
  email: 'info@wittenboerevents.nl',
  telephone: '+31627172876',
  image: `${SITE_URL}/og.jpg`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Het Schild 35',
    postalCode: '5275 EE',
    addressLocality: 'Den Dungen',
    addressCountry: 'NL',
  },
  sameAs: [
    'https://www.instagram.com/wittenboerevents/',
    'https://www.facebook.com/profile.php?id=100054423193609',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={`${anton.variable} ${figtree.variable} ${jetbrains.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <Script
          id="js-loaded-flag"
          strategy="beforeInteractive"
        >{`document.documentElement.classList.add('js-loaded')`}</Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
