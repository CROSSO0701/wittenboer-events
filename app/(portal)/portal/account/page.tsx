import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '../../../lib/db/server'
import { PasswordForm } from './PasswordForm'

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login?next=/portal/account')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, has_password')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          Account
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-[var(--color-fg)]">
          Profiel
        </h1>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
          <Field label="Naam" value={profile?.full_name ?? '—'} />
          <Field label="E-mail" value={profile?.email ?? user.email ?? '—'} />
          <Field label="Rol" value={profile?.role ?? '—'} />
          <Field
            label="Wachtwoord ingesteld"
            value={profile?.has_password ? 'Ja' : 'Nog niet'}
          />
        </dl>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-[var(--color-fg)]">
          Wachtwoord
        </h2>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {profile?.has_password
            ? 'Wijzig je wachtwoord. Vul je huidige wachtwoord in ter bevestiging.'
            : 'Stel een wachtwoord in zodat je voortaan zonder magic-link kunt inloggen.'}
        </p>
        <Suspense fallback={null}>
          <PasswordForm hasPassword={!!profile?.has_password} />
        </Suspense>
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">{label}</dt>
      <dd className="text-[var(--color-fg)]">{value}</dd>
    </div>
  )
}
