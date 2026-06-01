import { NextResponse } from 'next/server'
import { ipFromRequest, rateLimit } from '../../../lib/auth/rate-limit'

// Server-proxy naar Photon (gratis, OSM-based geocoder van Komoot). Houdt de
// usage server-side, omzeilt CORS en geeft NL-georiënteerde adresregels terug.
// Faalt altijd graceful: nooit een 500 naar de UI, bij twijfel { results: [] }.

const PHOTON_URL = 'https://photon.komoot.io/api/'
// Nette identificatie richting de gratis dienst (fair use).
const USER_AGENT = 'WittenboerEvents/1.0 (admin-planning; info@wittenboerevents.nl)'

type PhotonProps = {
  name?: string
  street?: string
  housenumber?: string
  postcode?: string
  city?: string
  district?: string
  state?: string
  country?: string
}
type PhotonFeature = { properties?: PhotonProps }

// Bouw één leesbare NL-adresregel uit de losse velden. Lege delen overslaan.
function toLabel(p: PhotonProps): string {
  const street = [p.street, p.housenumber].filter(Boolean).join(' ')
  const place = [p.postcode, p.city ?? p.district].filter(Boolean).join(' ')
  // name alleen tonen als het niet al gelijk is aan straat (voorkomt dubbeling).
  const name = p.name && p.name !== street ? p.name : undefined
  const parts = [name, street, place, p.country].filter((v): v is string => Boolean(v && v.trim()))
  // Dedupe achtereenvolgende gelijke delen.
  const seen: string[] = []
  for (const part of parts) {
    if (seen[seen.length - 1] !== part) seen.push(part)
  }
  return seen.join(', ')
}

export async function GET(request: Request) {
  // Rate-limit per IP (~60/min). Bij overschrijding gewoon leeg teruggeven,
  // zodat de autocomplete niet vervelend gaat foutmelden.
  const ip = ipFromRequest(request)
  const limited = rateLimit(`geo-search:${ip}`, 60, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ results: [] }, { status: 200 })
  }

  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Photon ondersteunt GEEN lang=nl (alleen default/de/en/fr) — met lang=nl
    // geeft het een foutobject i.p.v. resultaten. Default = lokale namen (NL).
    // lat/lon biast richting Nederland zodat NL-adressen bovenaan komen.
    const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&limit=6&lat=52.1&lon=5.29`
    // Korte timeout zodat een trage geocoder de UI niet ophoudt.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    let res: Response
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = (await res.json().catch(() => null)) as { features?: PhotonFeature[] } | null
    const features = data?.features ?? []

    const results: { label: string }[] = []
    const seenLabels = new Set<string>()
    for (const f of features) {
      const label = toLabel(f.properties ?? {})
      if (!label || seenLabels.has(label)) continue
      seenLabels.add(label)
      results.push({ label })
    }

    return NextResponse.json({ results })
  } catch {
    // Netwerkfout, abort, parse-fout — altijd graceful.
    return NextResponse.json({ results: [] })
  }
}
