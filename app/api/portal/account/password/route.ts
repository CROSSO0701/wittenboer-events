import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { passwordUpdateSchema } from '../../../../lib/schemas/auth'
import { AuthError, requireUser } from '../../../../lib/auth/helpers'
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '../../../../lib/db/server'

export async function POST(request: Request) {
  let user
  try {
    user = await requireUser()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  let input
  try {
    input = passwordUpdateSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Niet alle velden zijn correct ingevuld.', issues: err.issues },
        { status: 400 }
      )
    }
    throw err
  }

  const supabaseSrv = await createSupabaseServerClient()

  // Check huidige has_password status
  const { data: profile } = await supabaseSrv
    .from('profiles')
    .select('has_password, email')
    .eq('id', user.id)
    .maybeSingle()

  // Als user al een password heeft, is currentPassword verplicht en moet die kloppen.
  if (profile?.has_password) {
    if (!input.currentPassword) {
      return NextResponse.json(
        { error: 'Geef je huidige wachtwoord op om dit te wijzigen.' },
        { status: 400 }
      )
    }
    if (!user.email) {
      return NextResponse.json(
        { error: 'Geen e-mailadres bekend voor verificatie.' },
        { status: 400 }
      )
    }
    // Verifieer huidig wachtwoord met admin-client (raakt geen sessie aan)
    const admin = createSupabaseAdminClient()
    const { error: verifyErr } = await admin.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    })
    if (verifyErr) {
      return NextResponse.json({ error: 'Huidig wachtwoord klopt niet.' }, { status: 401 })
    }
  }

  // Zet nieuw wachtwoord op de auth-user (server-side via SSR client = ingelogde user)
  const { error: updateErr } = await supabaseSrv.auth.updateUser({ password: input.newPassword })
  if (updateErr) {
    return NextResponse.json(
      { error: 'Wachtwoord kon niet worden opgeslagen.', detail: updateErr.message },
      { status: 500 }
    )
  }

  // Markeer profile.has_password = true
  const { error: profErr } = await supabaseSrv
    .from('profiles')
    .update({ has_password: true })
    .eq('id', user.id)

  if (profErr) {
    // Niet kritiek — wachtwoord is gezet — maar log
    return NextResponse.json({ ok: true, warn: profErr.message })
  }

  return NextResponse.json({ ok: true })
}
