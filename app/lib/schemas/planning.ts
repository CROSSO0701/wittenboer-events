import { z } from 'zod'

const isoDateTime = z.string().datetime({ offset: true })
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')

const optionalISODate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalDateTime = isoDateTime.optional().or(z.literal('').transform(() => undefined))
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined))

export const KLUS_KINDS = ['opbouw', 'afbreken', 'ophalen', 'overig'] as const
export const AVAILABILITY_KINDS = ['vrij', 'vakantie'] as const

const klusAssignment = z.object({
  staff_id: z.string().uuid(),
  role_on_job: z.string().trim().max(120).optional().or(z.literal('').transform(() => undefined)),
  notification_channel: z.enum(['email', 'whatsapp', 'sms']).default('email'),
})

// Klus aanmaken (logistiek: opbouw/afbreken/ophalen/overig).
export const createKlusSchema = z.object({
  title: z.string().trim().min(1, 'Geef een titel op').max(200),
  kind: z.enum(KLUS_KINDS).default('opbouw'),
  event_date: isoDate,
  event_start: optionalDateTime,
  event_end: optionalDateTime,
  location: optionalText(500),
  notes: optionalText(5000),
  booking_id: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  assignments: z.array(klusAssignment).max(20).optional(),
  override_overlap: z.boolean().optional(),
})

// Klus bewerken — alle velden optioneel.
export const updateKlusSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  kind: z.enum(KLUS_KINDS).optional(),
  event_date: optionalISODate,
  event_start: optionalDateTime,
  event_end: optionalDateTime,
  location: optionalText(500),
  notes: optionalText(5000),
  booking_id: z.string().uuid().nullable().optional().or(z.literal('').transform(() => null)),
  assignments: z.array(klusAssignment).max(20).optional(),
  override_overlap: z.boolean().optional(),
})

// Vrij/vakantie-periode aanmaken.
export const createAvailabilitySchema = z
  .object({
    staff_id: z.string().uuid(),
    start_date: isoDate,
    end_date: isoDate,
    kind: z.enum(AVAILABILITY_KINDS).default('vrij'),
    note: optionalText(2000),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: 'Einddatum mag niet vóór de startdatum liggen',
    path: ['end_date'],
  })

// Vrij/vakantie-periode bewerken.
export const updateAvailabilitySchema = z
  .object({
    start_date: optionalISODate,
    end_date: optionalISODate,
    kind: z.enum(AVAILABILITY_KINDS).optional(),
    note: optionalText(2000),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: 'Einddatum mag niet vóór de startdatum liggen',
    path: ['end_date'],
  })

export type CreateKlusInput = z.infer<typeof createKlusSchema>
export type UpdateKlusInput = z.infer<typeof updateKlusSchema>
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>
