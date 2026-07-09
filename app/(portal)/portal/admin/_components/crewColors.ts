/**
 * Vaste, onderscheidende kleuren per crewlid voor de kalenderweergave (#kalender).
 *
 * Google Agenda geeft elke agenda een eigen kleur; wij doen hetzelfde per
 * crewlid. Belangrijk is stabiliteit: dezelfde persoon moet altijd dezelfde
 * kleur krijgen. Daarom wijzen we toe op basis van de index in de (alfabetisch)
 * gesorteerde crew-lijst, niet op volgorde van binnenkomst.
 *
 * Het palet is rustig/professioneel gekozen, passend bij de petrol/zand-huisstijl
 * (matige verzadiging, voldoende licht verschil tussen tinten). Vaste HSL-waarden
 * mogen hier: het zijn categorische data-kleuren, geen thema-tokens.
 */

export type CrewColor = {
  /** Zachte achtergrond voor de pil. */
  bg: string
  /** Rand van de pil. */
  border: string
  /** Tekstkleur op de zachte achtergrond (donker genoeg voor leesbaarheid). */
  text: string
  /** Volle kleurstip voor de legenda. */
  dot: string
}

// 12 tinten. Elke tint definieert een base-hue/sat; de vier vlakken zijn daaruit
// afgeleid zodat achtergrond licht en tekst donker blijft (leesbaar contrast).
const HUES: { h: number; s: number }[] = [
  { h: 191, s: 45 }, // petrol (huisstijl-primary-familie)
  { h: 24, s: 55 }, // terracotta
  { h: 262, s: 38 }, // paars-blauw
  { h: 142, s: 38 }, // groen
  { h: 340, s: 45 }, // framboos
  { h: 40, s: 60 }, // oker/zand
  { h: 210, s: 48 }, // staalblauw
  { h: 8, s: 50 }, // baksteen
  { h: 168, s: 40 }, // teal-groen
  { h: 288, s: 38 }, // magenta-paars
  { h: 96, s: 38 }, // olijf
  { h: 224, s: 42 }, // indigo
]

function colorFromHue(h: number, s: number): CrewColor {
  return {
    bg: `hsl(${h} ${s}% 94%)`,
    border: `hsl(${h} ${s}% 72%)`,
    text: `hsl(${h} ${Math.min(s + 10, 70)}% 28%)`,
    dot: `hsl(${h} ${s}% 48%)`,
  }
}

/** Neutrale tint voor items zonder toegewezen crew. */
export const NEUTRAL_CREW_COLOR: CrewColor = {
  bg: 'hsl(210 8% 93%)',
  border: 'hsl(210 8% 74%)',
  text: 'hsl(210 10% 32%)',
  dot: 'hsl(210 8% 55%)',
}

/** Aparte, herkenbare zand-tint voor vrij/vakantie (past bij tertiary). */
export const AVAILABILITY_COLOR: CrewColor = {
  bg: 'hsl(36 45% 90%)',
  border: 'hsl(36 40% 68%)',
  text: 'hsl(30 40% 30%)',
  dot: 'hsl(34 45% 52%)',
}

/**
 * Bouwt een stabiele map van crew-id -> kleur op basis van de gesorteerde
 * crew-lijst. De caller geeft de lijst al gesorteerd door (useStaffList levert
 * full_name asc); we sorteren defensief nog een keer op id als tie-breaker,
 * zodat de toewijzing deterministisch is.
 */
export function buildCrewColorMap(
  crew: { id: string; full_name: string | null }[]
): Map<string, CrewColor> {
  const sorted = [...crew].sort((a, b) => {
    const an = (a.full_name ?? '').toLowerCase()
    const bn = (b.full_name ?? '').toLowerCase()
    if (an !== bn) return an < bn ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
  const map = new Map<string, CrewColor>()
  sorted.forEach((c, i) => {
    const { h, s } = HUES[i % HUES.length]!
    map.set(c.id, colorFromHue(h, s))
  })
  return map
}
