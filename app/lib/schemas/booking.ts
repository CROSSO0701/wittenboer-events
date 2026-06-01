import { z } from 'zod'

const isoDateTime = z.string().datetime({ offset: true })
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')

export const artistSubmitBookingSchema = z.object({
  client_name: z.string().trim().min(1).max(200),
  client_email: z.string().trim().toLowerCase().email().optional().or(z.literal('').transform(() => undefined)),
  client_phone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
  event_date: isoDate,
  event_start: isoDateTime.optional(),
  event_end: isoDateTime.optional(),
  event_location: z.string().trim().min(1).max(500),
  fee_cents: z.coerce.number().int().min(0).max(10_000_000).optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal('').transform(() => undefined)),
})

export const acceptBookingSchema = z.object({
  staff_ids: z.array(z.string().uuid()).max(20).optional(),
  override_overlap: z.boolean().optional(),
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
