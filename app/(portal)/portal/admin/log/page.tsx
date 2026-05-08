import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { ActivityFeed } from './ActivityFeed'

export const metadata: Metadata = { title: 'Activiteit' }
export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin/log')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/portal/account')

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          Activiteit
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Wat is er gebeurd
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Chronologisch overzicht van alle wijzigingen in het portaal.
        </p>
      </header>

      <ActivityFeed />
    </div>
  )
}
