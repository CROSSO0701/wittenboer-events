import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/db/server'
import { CrewDashboard } from './_components/CrewDashboard'

export const metadata: Metadata = {
  title: 'Mijn klussen',
  robots: { index: false, follow: false },
}

export default async function CrewPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/crew')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'admin') redirect('/portal/admin')
  if (profile?.role === 'artist') redirect('/portal/artiest')
  if (profile?.role !== 'staff') {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-fg-muted)]">
        Je account heeft nog geen crew-toegang. Neem contact op om dit in orde te maken.
      </div>
    )
  }

  return <CrewDashboard name={profile?.full_name ?? user.email ?? 'crew'} />
}
