import { z } from 'zod'

const cleanString = z
  .string()
  .trim()
  .max(2000)
  .transform((s) => (s.length === 0 ? undefined : s))
  .optional()

const requiredString = z.string().trim().min(1, 'Verplicht veld').max(500)
const email = z.string().trim().toLowerCase().email('Ongeldig e-mailadres').max(320)
const phone = z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined))

// Honeypot — bots vullen dit, mensen niet. We laten validatie ALTIJD slagen
// en checken post-parse zodat we silent-200 kunnen teruggeven (anders verraden
// we het bestaan van het veld).
const honeypot = z.string().optional()

export const contactInquirySchema = z.object({
  type: z.literal('contact'),
  website: honeypot,
  name: requiredString,
  email,
  phone,
  subject: cleanString,
  message: requiredString.max(5000),
})

export const showPackageInquirySchema = z.object({
  type: z.literal('show-package'),
  website: honeypot,
  package_slug: z.string().trim().min(1).max(100).optional(),
  name: requiredString,
  organisation: cleanString,
  email,
  phone,
  event_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  guest_count: z.coerce.number().int().min(1).max(50000).optional(),
  location: cleanString,
  notes: cleanString,
})

export const artistBookingInquirySchema = z.object({
  type: z.literal('artist-booking'),
  website: honeypot,
  artist_slug: z.string().trim().min(1).max(100),
  name: requiredString,
  organisation: cleanString,
  email,
  phone,
  event_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  event_location: cleanString,
  notes: cleanString,
})

export const inquirySchema = z.discriminatedUnion('type', [
  contactInquirySchema,
  showPackageInquirySchema,
  artistBookingInquirySchema,
])

export type InquiryInput = z.infer<typeof inquirySchema>
export type ContactInquiryInput = z.infer<typeof contactInquirySchema>
export type ShowPackageInquiryInput = z.infer<typeof showPackageInquirySchema>
export type ArtistBookingInquiryInput = z.infer<typeof artistBookingInquirySchema>
