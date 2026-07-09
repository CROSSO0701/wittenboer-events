import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '../../../lib/db/server'

type OtpType = 'email' | 'magiclink'

// Deelbare inloglink (24 uur geldig, herbruikbaar). De admin genereert deze via
// /api/admin/staff/[id]/login-link of /api/admin/artists/[id]/login-link en
// stuurt 'm bijv. via WhatsApp. Deze route zoekt het profiel op het token,
// controleert de geldigheid, zet een VERSE sessie (cookies) en stuurt de
// gebruiker naar zijn eigen portal. Het token blijft staan (herbruikbaar).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const origin = request.nextUrl.origin

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, origin))

  if (!token) {
    return redirectTo('/portal/login')
  }

  let admin
  try {
    admin = createSupabaseAdminClient()
  } catch {
    return redirectTo('/portal/login?error=link')
  }

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, email, role, login_link_expires_at')
    .eq('login_link_token', token)
    .maybeSingle()

  if (profileErr || !profile) {
    return redirectTo('/portal/login?error=link')
  }

  // Admins loggen uitsluitend met wachtwoord in; deelbare inloglinks zijn alleen
  // voor crew en artiesten (defense-in-depth tegen een gelekte admin-link).
  if (profile.role === 'admin') {
    return redirectTo('/portal/login?error=link')
  }

  const expires = profile.login_link_expires_at
  if (!expires || new Date(expires).getTime() <= Date.now()) {
    return redirectTo('/portal/login?error=link')
  }

  // E-mail ophalen: uit profiel, anders uit auth.users.
  let email = profile.email
  if (!email) {
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    email = authUser?.user?.email ?? null
  }
  if (!email) {
    return redirectTo('/portal/login?error=link')
  }

  // Verse sessie: genereer een magic-link hashed_token en verifieer die met de
  // SSR-server-client, die de auth-cookies schrijft.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const hashedToken = linkData?.properties?.hashed_token
  if (linkErr || !hashedToken) {
    return redirectTo('/portal/login?error=link')
  }

  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return redirectTo('/portal/login?error=link')
  }

  const tryVerify = async (type: OtpType) =>
    supabase.auth.verifyOtp({ token_hash: hashedToken, type })

  let verifyErr = (await tryVerify('email')).error
  if (verifyErr) {
    verifyErr = (await tryVerify('magiclink')).error
  }
  if (verifyErr) {
    return redirectTo('/portal/login?error=link')
  }

  // Token blijft staan: 24 uur herbruikbaar.

  // Admins zijn hierboven al geweigerd; alleen crew/artiest komen hier.
  const target = profile.role === 'artist' ? '/portal/artiest' : '/portal/crew'

  // De verifyOtp hierboven schreef de auth-cookies via next/headers; die worden
  // automatisch aan deze redirect-response gehangen zodat de sessie meteen actief is.
  return redirectTo(target)
}
