import { z } from 'zod'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export const inviteArtistSchema = z
  .object({
    artist_id: z.string().uuid().optional(),
    stage_name: z.string().trim().min(1).max(120).optional(),
    genre: z.string().trim().max(80).optional().or(z.literal('').transform(() => undefined)),
    photo_url: z.string().trim().url().optional().or(z.literal('').transform(() => undefined)),
    email: z.string().trim().toLowerCase().email().max(320),
  })
  .refine((d) => d.artist_id || d.stage_name, {
    path: ['stage_name'],
    message: 'Kies een bestaande artiest of geef een podiumnaam op.',
  })

export type InviteArtistInput = z.infer<typeof inviteArtistSchema>

export const slugFor = slugify

export const inviteStaffSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
