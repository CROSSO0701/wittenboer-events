import { createSupabaseServerClient } from '../db/server'
import type { Database } from '../db/types.generated'

type UserRole = Database['public']['Enums']['user_role']

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'AuthError'
  }
}

type AuthedUser = {
  id: string
  email: string | null
  role: UserRole | null
}

export async function requireUser(): Promise<AuthedUser> {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    throw new AuthError('Authenticatie-service niet geconfigureerd.', 503)
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Niet ingelogd', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email ?? null,
    role: ((profile?.role as UserRole | undefined) ?? null),
  }
}

export async function requireRole(role: UserRole): Promise<AuthedUser> {
  const u = await requireUser()
  if (u.role !== role) {
    throw new AuthError('Geen toegang', 403)
  }
  return u
}

export async function requireAdmin() {
  return requireRole('admin')
}

export async function requireArtist() {
  return requireRole('artist')
}

export async function requireStaff() {
  return requireRole('staff')
}
