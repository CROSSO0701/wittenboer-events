import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Inloggen',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide text-[var(--color-fg)]">
        Inloggen artiestenportal
      </h1>
      <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
        Vul je e-mailadres in. Je krijgt een magic-link toegestuurd waarmee je direct ingelogd
        wordt. Geen wachtwoord nodig.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
