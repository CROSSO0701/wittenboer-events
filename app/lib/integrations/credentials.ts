import 'server-only'
import { createSupabaseAdminClient } from '../db/server'

export type IntegrationProvider = 'google_calendar' | 'artwinlive'

export type IntegrationCredential = {
  provider: IntegrationProvider
  refresh_token: string | null
  access_token: string | null
  expires_at: string | null
  extra: Record<string, unknown> | null
  updated_at: string
}

export async function getCredential(provider: IntegrationProvider): Promise<IntegrationCredential | null> {
  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('provider', provider)
      .maybeSingle()
    if (error || !data) return null
    return data as IntegrationCredential
  } catch {
    return null
  }
}

export async function upsertCredential(input: {
  provider: IntegrationProvider
  refresh_token?: string | null
  access_token?: string | null
  expires_at?: string | null
  extra?: Record<string, unknown> | null
  updated_by?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('integration_credentials')
      .upsert(
        {
          provider: input.provider,
          refresh_token: input.refresh_token ?? null,
          access_token: input.access_token ?? null,
          expires_at: input.expires_at ?? null,
          extra: (input.extra ?? null) as never,
          updated_by: input.updated_by ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider' }
      )
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
