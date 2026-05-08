import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'

export const metadata: Metadata = { title: 'Klanten' }
export const dynamic = 'force-dynamic'

type ClientRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  total_bookings: number
  total_value_cents: number
  last_booking_at: string | null
}

function formatEUR(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(d))
}

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

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
          Nog geen klanten geregistreerd. Bookings met een klant-email-adres voegen automatisch
          klanten toe.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2">Naam</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Telefoon</th>
                <th className="px-4 py-2 text-right">Bookings</th>
                <th className="px-4 py-2 text-right">Omzet</th>
                <th className="px-4 py-2">Laatste</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/admin/klanten/${c.id}`}
                      className="font-medium text-[var(--color-fg)] hover:text-[var(--color-primary)]"
                    >
                      {c.name ?? '(geen naam)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-[var(--color-fg)]">{c.total_bookings}</td>
                  <td className="px-4 py-3 text-right text-[var(--color-fg)]">
                    {formatEUR(c.total_value_cents)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                    {formatDate(c.last_booking_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
