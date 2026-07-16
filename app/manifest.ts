import type { MetadataRoute } from 'next'

// Web-app-manifest: maakt de portal installeerbaar als app-icoon op de telefoon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wittenboer Events',
    short_name: 'Wittenboer',
    description: 'De portal van Wittenboer Events: aanvragen, agenda en planning op zak.',
    start_url: '/portal',
    scope: '/portal',
    display: 'standalone',
    lang: 'nl',
    background_color: '#2A3840',
    theme_color: '#157A8C',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
