export type NavLink = {
  label: string
  href: string
  children?: { label: string; href: string; description?: string }[]
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Over ons', href: '/over-ons' },
  {
    label: 'Aanbod',
    href: '/aanbod',
    children: [
      { label: 'Ons aanbod', href: '/aanbod', description: 'Overzicht van alle diensten' },
      { label: 'Geluid', href: '/aanbod/geluid', description: 'Line-arrays, mixers, monitoring' },
      { label: 'Licht', href: '/aanbod/licht', description: 'Lichtontwerp en moving heads' },
      { label: 'Tapeshows', href: '/aanbod/tapeshows', description: 'Tape-operator naast de artiest' },
      { label: 'Stroomvoorziening', href: '/aanbod/stroomvoorziening', description: 'Aggregaten 25–500 kVA' },
      { label: 'Artiestenbegeleiding', href: '/aanbod/artiestenbegeleiding', description: 'Backstage van aankomst tot encore' },
      { label: 'Productiebegeleiding', href: '/aanbod/productiebegeleiding', description: 'End-to-end coördinatie' },
    ],
  },
  { label: 'Artiesten', href: '/artiesten' },
  { label: 'Projecten', href: '/projecten' },
  { label: 'Contact', href: '/contact' },
]
