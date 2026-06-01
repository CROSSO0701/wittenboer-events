import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
const isoDateTime = z.string().datetime({ offset: true })

/**
 * Publieke artiest-aanmelding (GEEN login) — een artiest geeft via een open
 * formulier een klus door. Wordt een `booking` met source='artist', status
 * 'pending', zodat Marnix het in "Te doen" beoordeelt. `website` is een
 * honeypot: bots vullen 'm, mensen zien 'm niet → stilletjes weggegooid.
 */
export const artistPublicSubmitSchema = z.object({
  artist_id: z.string().uuid('Kies een artiest'),
  client_name: z.string().trim().min(1, 'Vul in voor wie of welk evenement').max(200),
  client_phone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
  event_date: isoDate,
  event_start: isoDateTime.optional().or(z.literal('').transform(() => undefined)),
  event_location: z.string().trim().min(1, 'Vul een locatie in').max(500),
  notes: z.string().trim().max(5000).optional().or(z.literal('').transform(() => undefined)),
  website: z.string().max(0).optional(), // honeypot — moet leeg zijn
})

export type ArtistPublicSubmitInput = z.infer<typeof artistPublicSubmitSchema>
