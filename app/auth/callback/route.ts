// Supabase auth callback: ondersteunt zowel PKCE (?code=...) als de oudere
// OTP-style (?token_hash=...&type=...) flow. Wisselt uit voor een sessie en
// stuurt door naar de juiste pagina o.b.v. rol / wachtwoord-status.

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../lib/db/server'

type OtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash') ?? url.searchParams.get('token')
  const type = url.searchParams.get('type') as OtpType | null
  const next = url.searchParams.get('next') ?? ''
  const errorDesc = url.searchParams.get('error_description') ?? url.searchParams.get('error')

  if (errorDesc) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', errorDesc)
    return NextResponse.redirect(dest)
  }

  if (!code && !tokenHash) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', 'Geen code ontvangen — link verlopen of ongeldig.')
    return NextResponse.redirect(dest)
  }

  const supabase = await createSupabaseServerClient()

  let authError: string | null = null
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) authError = error.message
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) authError = error.message
  } else if (tokenHash) {
    // Token zonder type — probeer magiclink als default
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
    if (error) authError = error.message
  }

  if (authError) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', authError)
    return NextResponse.redirect(dest)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', 'Sessie kon niet worden gestart.')
    return NextResponse.redirect(dest)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, has_password')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && !profile.has_password) {
    return NextResponse.redirect(new URL('/portal/account?firstTime=true', url.origin))
  }

  let target = next || '/portal/account'
  if (profile?.role === 'admin') target = '/portal/admin'
  else if (profile?.role === 'artist') target = '/portal/artiest'

  return NextResponse.redirect(new URL(target, url.origin))
}
