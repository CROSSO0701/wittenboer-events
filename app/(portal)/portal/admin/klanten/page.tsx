import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { KlantenTable, type ClientRow } from './KlantenTable'

export const metadata: Metadata = { title: 'Klanten' }
export const dynamic = 'force-dynamic'

export default async function KlantenPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin/klanten')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/portal/account')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, email, phone, total_bookings, total_value_cents, last_booking_at')
    .order('last_booking_at', { ascending: false, nullsFirst: false })

  const rows = (clients as ClientRow[] | null) ?? []

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          Klanten
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Klantendatabase
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Wordt automatisch bijgehouden zodra je een booking aanmaakt met een klant-emailadres.
        </p>
      </header>

      <KlantenTable rows={rows} />
    </div>
  )
}
