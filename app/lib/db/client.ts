'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types.generated'

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Supabase env vars ontbreken (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)')
  }
  return createBrowserClient<Database>(url, anon)
}
