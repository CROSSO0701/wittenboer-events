import { z } from 'zod'
import { setupTypeSchema, floorLevelSchema } from './artist-public'

const isoDateTime = z.string().datetime({ offset: true })
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')

/**
 * Ingelogde artiest-aanmelding vanuit het portal. Deze heeft exact dezelfde
 * velden en verplichtingen als het publieke `/klus-doorgeven` (zie
 * `artistPublicSubmitSchema`), met één verschil: de artiestennaam is niet nodig,
 * die is al bekend uit de login. De showtijden (begin + eind) horen bij één
 * "Showtijden"-veld op het formulier; het telefoonnummer is dat van de
 * contactpersoon van de klant. Kernvelden zijn verplicht: te weinig info mag
 * niet verzonden worden.
 */
export const artistSubmitBookingSchema = z.object({
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
})

export const acceptBookingSchema = z.object({
  staff_ids: z.array(z.string().uuid()).max(20).optional(),
  override_overlap: z.boolean().optional(),
  // Optioneel aangepaste details die mee naar Google gaan.
  event_date: isoDate.optional().or(z.literal('').transform(() => undefined)),
  event_start: isoDateTime.optional().or(z.literal('').transform(() => undefined)),
  event_end: isoDateTime.optional().or(z.literal('').transform(() => undefined)),
  event_location: z.string().trim().min(1).max(500).optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal('').transform(() => undefined)),
})

export const declineBookingSchema = z.object({
  reason: z.string().trim().min(1, 'Geef een reden op').max(2000),
})

export const assignStaffSchema = z.object({
  assignments: z
    .array(
      z.object({
        staff_id: z.string().uuid(),
        role_on_job: z.string().trim().max(120).optional(),
        notification_channel: z.enum(['email', 'whatsapp', 'sms']).default('email'),
      })
    )
    .min(1, 'Minimaal één toewijzing')
    .max(20),
  override_overlap: z.boolean().optional(),
})

const optionalISODate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalDateTime = isoDateTime.optional().or(z.literal('').transform(() => undefined))

export const updateBookingSchema = z.object({
  event_date: optionalISODate,
  event_start: optionalDateTime,
  event_end: optionalDateTime,
  event_location: z.string().trim().min(1).max(500).optional(),
  fee_cents: z.coerce.number().int().min(0).max(10_000_000).optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal('').transform(() => undefined)),
  client_name: z.string().trim().min(1).max(200).optional(),
  client_email: z.string().trim().toLowerCase().email().optional().or(z.literal('').transform(() => undefined)),
  client_phone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
})

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
})

export type ArtistSubmitBookingInput = z.infer<typeof artistSubmitBookingSchema>
export type AcceptBookingInput = z.infer<typeof acceptBookingSchema>
export type DeclineBookingInput = z.infer<typeof declineBookingSchema>
export type AssignStaffInput = z.infer<typeof assignStaffSchema>
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
