import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { AgendaBoard } from '../_components/AgendaBoard'

export const metadata: Metadata = { title: 'Agenda' }
export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin/agenda')
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
          Agenda
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Alle boekingen op datum
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Geaccepteerde shows en open aanvragen, op datum onder elkaar. Klik een boeking om te
          bewerken, crew toe te wijzen of de tijd aan te passen — wijzigingen gaan automatisch mee
          naar de Google-agenda.
        </p>
      </header>
      <AgendaBoard />
    </div>
  )
}
