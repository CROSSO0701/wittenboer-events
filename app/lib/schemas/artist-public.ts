import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
const isoDateTime = z.string().datetime({ offset: true })

/**
 * Publieke artiest-aanmelding (GEEN login, GEEN roster). Een artiest typt zelf
 * z'n naam en geeft een optreden door; het wordt een `booking` met source
 * 'artist', status 'pending', zodat Marnix het in "Te doen" beoordeelt.
 * `website` is een honeypot: bots vullen 'm, mensen zien 'm niet.
 *
 * Kernvelden zijn verplicht: te weinig info mag niet verzonden worden. De
 * showtijden (begin + eind) horen bij één "Showtijden"-veld op het formulier.
 * Het telefoonnummer is dat van de contactpersoon van de klant.
 */
export const setupTypeSchema = z.enum(['prikken', 'opbouwen'], {
  message: 'Kies prikken of opbouwen',
})

export const floorLevelSchema = z.enum(['begane_grond', 'verdieping'], {
  message: 'Kies begane grond of verdieping',
})

export const artistPublicSubmitSchema = z.object({
  artist_name: z.string().trim().min(1, 'Vul je naam in').max(120),
  event: z.string().trim().min(1, 'Vul in voor wie of welk evenement').max(200),
  client_phone: z.string().trim().min(1, 'Vul het telefoonnummer van de contactpersoon in').max(40),
  event_date: isoDate,
  event_start: isoDateTime,
  event_end: isoDateTime,
  event_location: z.string().trim().min(1, 'Vul een locatie in').max(500),
  setup_type: setupTypeSchema,
  floor_level: floorLevelSchema.optional().or(z.literal('').transform(() => undefined)),
  paved_path: z.boolean().optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal('').transform(() => undefined)),
  website: z.string().max(0).optional(), // honeypot, moet leeg zijn
})

export type ArtistPublicSubmitInput = z.infer<typeof artistPublicSubmitSchema>
