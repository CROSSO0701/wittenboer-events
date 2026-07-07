'use client'

// Supabase magic-link / invite landing — werkt voor alle 3 token-vormen:
// - PKCE: ?code=...
// - OTP token-hash: ?token_hash=...&type=...
// - Implicit flow: #access_token=...&refresh_token=...  (fragment, alleen client-side leesbaar)

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '../../lib/db/client'

type OtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Inloggen...')

  useEffect(() => {
    let cancelled = false

    async function run() {
      const supabase = createSupabaseBrowserClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const tokenHash = url.searchParams.get('token_hash') ?? url.searchParams.get('token')
      const type = url.searchParams.get('type') as OtpType | null
      const next = url.searchParams.get('next') ?? ''
      const errorDesc = url.searchParams.get('error_description') ?? url.searchParams.get('error')

      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashError = hashParams.get('error_description') ?? hashParams.get('error')

      const failWith = (msg: string) => {
        if (cancelled) return
        router.replace(`/portal/login?auth_error=${encodeURIComponent(msg)}`)
      }

      if (errorDesc || hashError) {
        failWith(errorDesc ?? hashError ?? 'Inloggen mislukt.')
        return
      }

      let authError: string | null = null

      if (accessToken && refreshToken) {
        setStatus('Sessie opzetten...')
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) authError = error.message
      } else if (code) {
        setStatus('Code uitwisselen...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) authError = error.message
      } else if (tokenHash) {
        setStatus('Token verifiëren...')
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type ?? 'magiclink') as OtpType,
        })
        if (error) authError = error.message
      } else {
        failWith('Geen code ontvangen, link verlopen of ongeldig.')
        return
      }

      if (authError) {
        failWith(authError)
        return
      }

      setStatus('Profiel laden...')
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        failWith('Sessie kon niet worden gestart.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, has_password')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (profile && !profile.has_password) {
        router.replace('/portal/account?firstTime=true')
        return
      }

      let target = next || '/portal/account'
      if (profile?.role === 'admin') target = '/portal/admin'
      else if (profile?.role === 'artist') target = '/portal/artiest'
      else if (profile?.role === 'staff') target = '/portal/crew'
      router.replace(target)
    }

    run().catch((err) => {
      if (cancelled) return
      const msg = err instanceof Error ? err.message : String(err)
      router.replace(`/portal/login?auth_error=${encodeURIComponent(msg)}`)
    })

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-[var(--color-fg-muted)]">{status}</p>
    </div>
  )
}
