import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wittenboerevents.nl').replace(/\/$/, '')

// Dienst-slugs lopen synchroon met SERVICES in app/(public)/aanbod/[slug]/page.tsx
const AANBOD_SLUGS = [
  'geluid',
  'licht',
  'stroomvoorziening',
  'artiestenbegeleiding',
  'productiebegeleiding',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes = [
    { path: '/', priority: 1 },
    { path: '/over-ons', priority: 0.8 },
    { path: '/aanbod', priority: 0.9 },
    ...AANBOD_SLUGS.map((slug) => ({ path: `/aanbod/${slug}`, priority: 0.7 })),
    { path: '/show-pakketten', priority: 0.8 },
    { path: '/artiesten', priority: 0.7 },
    { path: '/projecten', priority: 0.7 },
    { path: '/contact', priority: 0.6 },
  ]

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: route.priority,
  }))
}
