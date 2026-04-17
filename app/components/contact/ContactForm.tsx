'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrors({})
    setFormError(null)

    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      message: String(form.get('message') ?? '').trim(),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors)
        setFormError(data?.error ?? 'Er ging iets mis. Probeer het nogmaals.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setFormError('Kon het bericht niet versturen. Bel of mail ons direct.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-[var(--radius-xl)] border p-8"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-primary-soft)' }}
      >
        <p className="mono mb-3" style={{ color: 'var(--color-primary-deep)' }}>
          Bericht ontvangen
        </p>
        <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600, color: 'var(--color-primary-deep)' }}>
          Dankjewel. Wij nemen binnen twee werkdagen contact op.
        </h3>
        <p className="mt-3" style={{ color: 'var(--color-fg-secondary)' }}>
          Spoed? Bel direct naar <a className="underline" href="tel:+31627172876">06 27 17 28 76</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Field id="name" name="name" label="Naam" type="text" required error={errors.name} />
      <Field id="email" name="email" label="E-mailadres" type="email" required error={errors.email} />
      <Field id="phone" name="phone" label="Telefoon (optioneel)" type="tel" />
      <TextareaField id="message" name="message" label="Vertel kort over je evenement" required error={errors.message} />

      {formError && (
        <p
          role="alert"
          className="text-[14px] px-4 py-3 rounded-md"
          style={{ backgroundColor: 'color-mix(in oklch, oklch(55% 0.18 25) 10%, transparent)', color: 'oklch(40% 0.18 25)' }}
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[14px] text-[15px] font-medium tracking-tight overflow-hidden disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-fg-on-dark)',
          opacity: status === 'submitting' ? 0.75 : 1,
        }}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {status === 'submitting' ? 'Versturen…' : 'Verstuur bericht'}
          {status !== 'submitting' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          )}
        </span>
        {status === 'submitting' && (
          <span
            aria-hidden
            className="absolute inset-0 shimmer"
            style={{ backgroundColor: 'transparent' }}
          />
        )}
      </button>
    </form>
  )
}

function Field({
  id,
  name,
  label,
  type,
  required,
  error,
}: {
  id: string
  name: string
  label: string
  type: string
  required?: boolean
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="mono" style={{ color: 'var(--color-fg-muted)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-primary)' }}> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        className="h-11 px-0 bg-transparent text-[16px] focus:outline-none transition-colors"
        style={{
          borderBottom: `0.5px solid ${error ? 'oklch(55% 0.18 25)' : 'var(--color-border-strong)'}`,
          color: 'var(--color-fg)',
        }}
      />
      {error && (
        <p className="text-[13px]" style={{ color: 'oklch(45% 0.18 25)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function TextareaField({
  id,
  name,
  label,
  required,
  error,
}: {
  id: string
  name: string
  label: string
  required?: boolean
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="mono" style={{ color: 'var(--color-fg-muted)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-primary)' }}> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={5}
        required={required}
        aria-invalid={error ? true : undefined}
        className="px-0 py-2 bg-transparent text-[16px] resize-y min-h-[120px] focus:outline-none transition-colors"
        style={{
          borderBottom: `0.5px solid ${error ? 'oklch(55% 0.18 25)' : 'var(--color-border-strong)'}`,
          color: 'var(--color-fg)',
        }}
      />
      {error && (
        <p className="text-[13px]" style={{ color: 'oklch(45% 0.18 25)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
