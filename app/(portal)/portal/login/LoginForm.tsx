'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Mail, Lock, KeyRound } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { createSupabaseBrowserClient } from '../../../lib/db/client'
import {
  forgotPasswordSchema,
  magicLinkSchema,
  passwordLoginSchema,
  type ForgotPasswordInput,
  type MagicLinkInput,
  type PasswordLoginInput,
} from '../../../lib/schemas/auth'

const SITE_URL =
  typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || ''

export function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? ''
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  // Toon foutmelding na een mislukte inlog-link callback (server-side route geeft auth_error mee).
  useEffect(() => {
    const authError = params.get('auth_error')
    if (!authError) return
    toast.error(`Inloggen mislukt: ${authError}`)
  }, [params])

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="password">
            <Lock size={14} /> Wachtwoord
          </TabsTrigger>
          <TabsTrigger value="magic">
            <Mail size={14} /> Inlog-link via mail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <PasswordPanel next={next} />
        </TabsContent>

        <TabsContent value="magic">
          {magicSent ? <MagicSentBanner onReset={() => setMagicSent(false)} /> : <MagicPanel next={next} onSent={() => setMagicSent(true)} />}
        </TabsContent>
      </Tabs>

      <div className="border-t border-[var(--color-border)] pt-3 text-center">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-primary)]"
          onClick={() => setForgotOpen((v) => !v)}
        >
          <KeyRound size={14} /> Wachtwoord vergeten?
        </button>
      </div>

      {forgotOpen && <ForgotPanel onClose={() => setForgotOpen(false)} />}
    </div>
  )
}

function PasswordPanel({ next }: { next: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordLoginInput>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: PasswordLoginInput) {
    setSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (error) throw error

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .maybeSingle()
      const target =
        profile?.role === 'admin'
          ? '/portal/admin'
          : profile?.role === 'artist'
            ? '/portal/artiest'
            : profile?.role === 'staff'
              ? '/portal/crew'
              : next || '/'
      toast.success('Ingelogd')
      router.replace(target)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Inloggen faalde'
      toast.error(/Invalid login credentials/i.test(msg) ? 'Onjuiste e-mail of wachtwoord.' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw-email">E-mail</Label>
        <Input id="pw-email" type="email" autoComplete="email" placeholder="je@voorbeeld.nl" {...register('email')} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw-password">Wachtwoord</Label>
        <Input
          id="pw-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Inloggen…' : 'Inloggen'}
      </Button>
    </form>
  )
}

function MagicPanel({ next, onSent }: { next: string; onSent: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: MagicLinkInput) {
    setSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const redirectTo = `${SITE_URL}/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ''
      }`
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      onSent()
      toast.success('Inlog-link verstuurd. Check je inbox.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Versturen faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ml-email">E-mail</Label>
        <Input id="ml-email" type="email" autoComplete="email" placeholder="je@voorbeeld.nl" {...register('email')} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Versturen…' : 'Stuur mij een inlog-link'}
      </Button>
    </form>
  )
}

function MagicSentBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2 text-[var(--color-primary-deep)]">
        <Mail size={16} />
        <span className="font-medium">Inlog-link verstuurd</span>
      </div>
      <p className="text-[var(--color-fg-muted)]">
        Open de mail in je inbox en klik op de link. Je wordt automatisch ingelogd en
        doorgestuurd naar je portaal.
      </p>
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        Andere mail proberen
      </Button>
    </div>
  )
}

function ForgotPanel({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const redirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent('/portal/account?reset=true')}`
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo })
      if (error) throw error
      setSent(true)
      toast.success('Reset-link verstuurd. Check je inbox.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Versturen faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-fg)]">Wachtwoord resetten</h3>
        <button type="button" onClick={onClose} className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
          Annuleren
        </button>
      </div>
      {sent ? (
        <p className="text-sm text-[var(--color-fg-muted)]">
          Reset-link verstuurd. Klik op de link in je mail om een nieuw wachtwoord in te stellen.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fp-email">E-mail</Label>
            <Input id="fp-email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Versturen…' : 'Stuur reset-link'}
          </Button>
        </form>
      )}
    </div>
  )
}
