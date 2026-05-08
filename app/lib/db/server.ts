import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types.generated'

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Supabase env vars ontbreken (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)')
  }
  const store = await cookies()
  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return store.getAll().map((c) => ({ name: c.name, value: c.value }))
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // Server Components kunnen cookies niet altijd schrijven; proxy doet dat.
        }
      },
    },
  })
}

// Service-role client — bypassed RLS. ALLEEN op de server gebruiken
// voor admin-acties die door requireAdmin() heen zijn.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    throw new Error('Supabase admin env vars ontbreken (SUPABASE_SERVICE_ROLE_KEY)')
  }
  return createClient<Database>(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
