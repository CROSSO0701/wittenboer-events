import { z } from 'zod'

export const magicLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ongeldig e-mailadres').max(320),
})
export type MagicLinkInput = z.infer<typeof magicLinkSchema>

export const passwordLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ongeldig e-mailadres').max(320),
  password: z.string().min(8, 'Minimaal 8 tekens').max(200),
})
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ongeldig e-mailadres').max(320),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().max(200).optional().or(z.literal('').transform(() => undefined)),
    newPassword: z.string().min(8, 'Minimaal 8 tekens').max(200),
    confirmPassword: z.string().min(8, 'Minimaal 8 tekens').max(200),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Wachtwoorden komen niet overeen',
  })
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>
