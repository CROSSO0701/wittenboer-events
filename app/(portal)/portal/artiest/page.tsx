import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/db/server'
import { ArtistDashboard } from './_components/ArtistDashboard'

export const metadata: Metadata = {
  title: 'Mijn portal',
  robots: { index: false, follow: false },
}

export default async function ArtiestPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/artiest')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'admin') redirect('/portal/admin')
  if (profile?.role !== 'artist') {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-fg-muted)]">
        Je profiel staat nog niet als artiest gemarkeerd. Vraag Marnix om je rol op te zetten.
      </div>
    )
  }

  const { data: artist } = await supabase
    .from('artists')
    .select('id, stage_name, slug')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <ArtistDashboard
      stageName={artist?.stage_name ?? profile?.full_name ?? user.email ?? 'artiest'}
      hasArtistRow={!!artist}
    />
  )
}
