import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../../lib/db/server'
import { sendCrewWelcome } from '../../../../../lib/crew/provision'
import { logAudit } from '../../../../../lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

// Stuurt een crewlid de welkomstmail (inloglink + persoonlijke agenda-link)
// opnieuw. Het staff-account bestaat al (aangemaakt bij "Crewlid toevoegen",
// bevestigd, zonder wachtwoord). Via /auth/callback belandt een crewlid zonder
// wachtwoord op de account-pagina om er een in te stellen. De rol blijft 'staff'.
export async function POST(_request: Request, context: RouteContext) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Ongeldige crew-ID.' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', id)
    .maybeSingle()
  if (targetErr) {
    return NextResponse.json({ error: 'Ophalen faalde.', detail: targetErr.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: 'Crewlid niet gevonden.' }, { status: 404 })
  }
  if (target.role !== 'staff') {
    return NextResponse.json({ error: 'Dit account is geen crewlid.' }, { status: 403 })
  }
  if (!target.email) {
    return NextResponse.json({ error: 'Dit crewlid heeft geen e-mailadres.' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Mail-service (Resend) is niet ingeschakeld, kan geen inlog- en agenda-mail versturen.' },
      { status: 503 }
    )
  }

  let result
  try {
    result = await sendCrewWelcome(supabase, {
      id: target.id,
      email: target.email,
      full_name: target.full_name,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Inlog- en agenda-mail versturen faalde.', detail },
      { status: 500 }
    )
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.invited',
    entity: 'profile',
    entityId: id,
    metadata: { email: target.email, mailSent: result.mailSent, mailError: result.mailError },
  })

  if (!result.mailSent) {
    return NextResponse.json(
      { error: 'Inlog- en agenda-mail kon niet worden verstuurd.', detail: result.mailError },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, mailSent: true })
}
