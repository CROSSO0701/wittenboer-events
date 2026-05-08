// Supabase magic-link / e-mail-confirm callback.
// PKCE-flow stuurt ?code=... terug; deze route wisselt het uit voor een sessie
// (cookies worden door createServerClient gezet) en leidt door naar de juiste pagina.

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../lib/db/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? ''
  const errorDesc = url.searchParams.get('error_description') ?? url.searchParams.get('error')

  if (errorDesc) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', errorDesc)
    return NextResponse.redirect(dest)
  }

  if (!code) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', 'Geen code ontvangen — link verlopen of ongeldig.')
    return NextResponse.redirect(dest)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const dest = new URL('/portal/login', url.origin)
    dest.searchParams.set('auth_error', error.message)
    return NextResponse.redirect(dest)
  }

  // Na uitwisseling weten we de user en kunnen we routen op rol.
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

  // Eerste keer — nog geen wachtwoord ingesteld
  if (profile && !profile.has_password) {
    return NextResponse.redirect(new URL('/portal/account?firstTime=true', url.origin))
  }

  let target = next || '/'
  if (profile?.role === 'admin') target = '/portal/admin'
  else if (profile?.role === 'artist') target = '/portal/artiest'
  else if (profile?.role === 'staff') target = '/portal/personeel'

  return NextResponse.redirect(new URL(target, url.origin))
}
