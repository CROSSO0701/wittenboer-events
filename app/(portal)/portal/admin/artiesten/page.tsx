import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { ArtistsAdminBoard } from './ArtistsAdminBoard'

export const metadata: Metadata = { title: 'Artiesten' }
export const dynamic = 'force-dynamic'

type ArtistRow = {
  id: string
  stage_name: string
  slug: string
  genre: string | null
  photo_url: string | null
  active: boolean
  profile_id: string | null
  display_order: number
}

export default async function ArtistsAdminPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin/artiesten')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/portal/account')

  const { data } = await supabase
    .from('artists')
    .select('id, stage_name, slug, genre, photo_url, active, profile_id, display_order')
    .order('display_order', { ascending: true })

  const artists = (data as ArtistRow[] | null) ?? []

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          Artiesten
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Wie heeft toegang tot het portaal?
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Geef artiesten toegang tot hun eigen portaal om aanvragen in te dienen.
        </p>
      </header>

      <ArtistsAdminBoard artists={artists} />
    </div>
  )
}
