import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/db/server'
import { ArtistDashboard } from './_components/ArtistDashboard'

export const metadata: Metadata = {
  title: 'Mijn portaal',
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
        Je account is nog niet als artiest geactiveerd. Neem contact op om dit in orde te maken.
      </div>
    )
  }

  // Defensief: pak de meest recente match. UNIQUE-constraint zorgt dat dit
  // normaal precies één rij is, maar bij legacy-data kan het meerdere zijn.
  const { data: artists } = await supabase
    .from('artists')
    .select('id, stage_name, slug, created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const artist = artists?.[0] ?? null

  return (
    <ArtistDashboard
      stageName={artist?.stage_name ?? profile?.full_name ?? user.email ?? 'artiest'}
      hasArtistRow={!!artist}
    />
  )
}
