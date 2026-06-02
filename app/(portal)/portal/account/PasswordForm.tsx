'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { passwordUpdateSchema, type PasswordUpdateInput } from '../../../lib/schemas/auth'

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const params = useSearchParams()
  const router = useRouter()
  const isReset = params.get('reset') === 'true'
  const isFirstTime = params.get('firstTime') === 'true'
  const [submitting, setSubmitting] = useState(false)
  const newRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordUpdateInput>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (isReset || isFirstTime) {
      newRef.current?.focus()
    }
  }, [isReset, isFirstTime])

  async function onSubmit(values: PasswordUpdateInput) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Wachtwoord opgeslagen.')
      reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan faalde')
    } finally {
      setSubmitting(false)
    }
  }

  const banner = isReset ? (
    <Banner tone="info">
      <ShieldCheck size={16} /> Stel je nieuwe wachtwoord in om verder te gaan.
    </Banner>
  ) : isFirstTime ? (
    <Banner tone="info">
      <ShieldCheck size={16} /> Welkom, stel een wachtwoord in zodat je volgende keer sneller
      kunt inloggen.
    </Banner>
  ) : null

  // Bij reset of first-time vragen we geen huidig wachtwoord
  const showCurrent = hasPassword && !isReset

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
      {banner}

      {showCurrent && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register('newPassword', {
            onChange: () => undefined,
          })}
          ref={(el) => {
            register('newPassword').ref(el)
            newRef.current = el
          }}
        />
        {errors.newPassword && <p className="text-xs text-red-600">{errors.newPassword.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Opslaan…' : hasPassword ? 'Wachtwoord wijzigen' : 'Wachtwoord instellen'}
        </Button>
      </div>
    </form>
  )
}

function Banner({ tone, children }: { tone: 'info'; children: React.ReactNode }) {
  return (
    <div
      className={
        tone === 'info'
          ? 'flex items-center gap-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-3 py-2 text-sm text-[var(--color-primary-deep)]'
          : ''
      }
    >
      {children}
    </div>
  )
}
