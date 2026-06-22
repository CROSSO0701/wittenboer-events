export type NavSubItem = {
  href: string
  label: string
  desc?: string
}

export type NavItem = {
  href: string
  label: string
  page: string
  submenu?: NavSubItem[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/over-ons', label: 'Over ons', page: 'over-ons' },
  {
    href: '/aanbod',
    label: 'Aanbod',
    page: 'aanbod',
    submenu: [
      { href: '/aanbod', label: 'Ons aanbod', desc: 'Overzicht van wat we doen' },
      { href: '/aanbod/geluid', label: 'Geluid', desc: 'Line-arrays, mixers, monitoring' },
      { href: '/aanbod/licht', label: 'Licht', desc: 'Lichtontwerp, fixtures, programmering' },
      {
        href: '/aanbod/stroomvoorziening',
        label: 'Stroomvoorziening',
        desc: 'Aggregaten en verdeelkasten',
      },
      {
        href: '/aanbod/artiestenbegeleiding',
        label: 'Artiesten',
        desc: 'Tapes & backstage van A tot Z',
      },
      {
        href: '/aanbod/productiebegeleiding',
        label: 'Productiebegeleiding',
        desc: 'Eén aanspreekpunt, van A tot Z',
      },
    ],
  },
  { href: '/show-pakketten', label: 'Showpakketten', page: 'show-pakketten' },
  { href: '/artiesten', label: 'Artiesten', page: 'artiesten' },
  { href: '/projecten', label: 'Projecten', page: 'projecten' },
  { href: '/contact', label: 'Contact', page: 'contact' },
]
