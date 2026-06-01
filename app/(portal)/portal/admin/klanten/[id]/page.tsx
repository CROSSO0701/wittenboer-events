import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../../lib/db/server'
import { StatusBadge } from '../../../_components/StatusBadge'
import { formatEUR, sourceLabel } from '../../../../../lib/format'

export const metadata: Metadata = { title: 'Klantdetail' }
export const dynamic = 'force-dynamic'

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(d))
}

export default async function KlantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, event_date, event_location, fee_cents, status, source')
    .eq('client_id', id)
    .order('event_date', { ascending: false, nullsFirst: false })

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/portal/admin/klanten"
          className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-primary)]"
        >
          ← Klanten
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-[var(--color-fg)]">
          {client.name ?? '(geen naam)'}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {client.email ?? '—'}
          {client.phone && <> · {client.phone}</>}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Boekingen totaal" value={String(client.total_bookings)} />
        <Stat label="Omzet totaal" value={formatEUR(client.total_value_cents)} />
        <Stat label="Eerste / laatste" value={`${formatDate(client.first_booking_at)} – ${formatDate(client.last_booking_at)}`} small />
      </div>

      {client.notes && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
            Notities
          </div>
          <p className="whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
          Boekingshistorie
        </h2>
        {!bookings || bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-6 text-center text-sm text-[var(--color-fg-muted)]">
            Geen boekingen gevonden voor deze klant.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                  <th className="px-4 py-2">Datum</th>
                  <th className="px-4 py-2">Locatie</th>
                  <th className="px-4 py-2">Bron</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Gage</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-1)]"
                  >
                    <td className="px-4 py-3 text-[var(--color-fg)]">{formatDate(b.event_date)}</td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">
                      {b.event_location ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{sourceLabel(b.source)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-fg-secondary)]">
                      {formatEUR(b.fee_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-strong)] bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div
        className={`mt-1 font-[family-name:var(--font-display)] leading-tight text-[var(--color-fg)] ${
          small ? 'text-xl' : 'text-3xl'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
