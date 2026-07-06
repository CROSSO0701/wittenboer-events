import { createSupabaseAdminClient } from '../../../lib/db/server'

export type Pkg = {
  slug: string
  name: string
  tagline: string | null
  description: string | null
  price_from_cents: number
  guest_capacity_min: number | null
  guest_capacity_max: number | null
  features: unknown
  is_popular: boolean
  display_order: number
}

export const FALLBACK_PKGS: Pkg[] = [
  {
    slug: 'compact',
    name: 'Compact',
    tagline: 'Instap-pakket',
    description: 'Voor verjaardagen en kleinere zalen tot ±80 gasten.',
    price_from_cents: 49500,
    guest_capacity_min: 20,
    guest_capacity_max: 80,
    features: [
      '1× DJ-meubel truss met LED parren',
      '1× 4-bar lichtbar',
      '1× Pioneer Deck',
      '1× A-set (geluid)',
    ],
    is_popular: false,
    display_order: 1,
  },
  {
    slug: 'booth',
    name: 'Booth',
    tagline: 'Compleet pakket',
    description: 'Strak DJ-booth met A-set (geluid). Tot ±150 gasten.',
    price_from_cents: 59500,
    guest_capacity_min: 50,
    guest_capacity_max: 150,
    features: [
      '1× DJ-booth met 4 LED parren',
      '2× 4-bar lichtbar',
      '1× Pioneer-set (CDJ + mixer)',
      '1× A-set (geluid)',
      '1× booth-monitor',
    ],
    is_popular: false,
    display_order: 2,
  },
  {
    slug: 'truss-show',
    name: 'Truss Show',
    tagline: 'Populairste',
    description: 'De full-show. Tot ±150 gasten.',
    price_from_cents: 69500,
    guest_capacity_min: 100,
    guest_capacity_max: 150,
    features: [
      '1× truss-booth met LED parren',
      '4× truss-paal met LED par + moving head',
      '1× Pioneer-set (CDJ + mixer)',
      '1× A-set (geluid)',
      '1× monitor',
    ],
    is_popular: true,
    display_order: 3,
  },
  {
    slug: 'show-wit',
    name: 'Show Wit',
    tagline: 'Premium · wit',
    description: 'Bruiloften en chique gala-avonden. Witte uitstraling.',
    price_from_cents: 79500,
    guest_capacity_min: 100,
    guest_capacity_max: 150,
    features: [
      '1× DJ-booth wit',
      '4× truss-paal met witte slave',
      '4× moving head',
      '4× LED par',
      '1× Pioneer-set (CDJ + mixer)',
      '1× A-set (geluid)',
      '1× booth-monitor',
    ],
    is_popular: false,
    display_order: 4,
  },
  {
    slug: 'show-goud',
    name: 'Black & Gold',
    tagline: 'Premium · goud',
    description:
      'Bruiloften en chique feesten met een warme, gouden uitstraling: gouden DJ-meubel, Portman P1’s en wash moving heads.',
    price_from_cents: 79500,
    guest_capacity_min: 100,
    guest_capacity_max: 150,
    features: [
      '1× DJ-meubel goud',
      '2× Portman P1',
      '2× wash moving head',
      '1× Pioneer-set (CDJ + mixer)',
      '1× A-set (geluid)',
      '1× monitor',
      '1× DJ-monitor',
    ],
    is_popular: false,
    display_order: 5,
  },
]

export async function loadPackages(): Promise<Pkg[]> {
  try {
    const supabase = createSupabaseAdminClient()
    const { data } = await supabase
      .from('disco_packages')
      .select(
        'slug, name, tagline, description, price_from_cents, guest_capacity_min, guest_capacity_max, features, is_popular, display_order'
      )
      .eq('active', true)
      .order('display_order', { ascending: true })
    if (data && data.length > 0) return data as Pkg[]
  } catch {
    // fall through naar de hardcoded set
  }
  return FALLBACK_PKGS
}

export function fmtEUR(cents: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function featureList(p: Pkg): string[] {
  return Array.isArray(p.features) ? (p.features as string[]) : []
}
