import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../../lib/db/server'
import { sendResend } from '../../../../../lib/integrations/resend'
import { renderEmail } from '../../../../../lib/email/render'
import { InviteMail } from '../../../../../lib/email/templates/invite'
import { logAudit } from '../../../../../lib/audit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type RouteContext = { params: Promise<{ id: string }> }

function friendlyAuthError(msg?: string | null): string {
  if (!msg) return 'Inloglink versturen faalde.'
  const m = msg.toLowerCase()
  if (m.includes('rate limit')) {
    return 'Te veel mails verstuurd. Probeer het over een uur opnieuw.'
  }
  if (m.includes('invalid') && m.includes('email')) return 'Ongeldig e-mailadres.'
  return `Inloglink versturen faalde: ${msg}`
}

// Stuurt een crewlid een inloglink om een wachtwoord in te stellen en in te
// loggen. Het staff-account bestaat al (aangemaakt bij "Crewlid toevoegen",
// bevestigd, zonder wachtwoord); daarom genereren we een magic-link. Via
// /auth/callback belandt een crewlid zonder wachtwoord op de account-pagina om
// er een in te stellen. De rol blijft 'staff'.
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
      { error: 'Mail-service (Resend) is niet ingeschakeld, kan geen inloglink versturen.' },
      { status: 503 }
    )
  }

  // /auth/callback stuurt crew zonder wachtwoord door naar de account-pagina om
  // er een in te stellen; wie er al een heeft, gaat direct naar /portal/crew.
  const redirectTo = `${SITE_URL}/auth/callback`

  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
    options: { redirectTo },
  })
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: friendlyAuthError(linkErr?.message), detail: linkErr?.message },
      { status: 500 }
    )
  }

  const mail = await renderEmail(
    InviteMail({
      name: target.full_name ?? 'crewlid',
      role: 'crewlid',
      link: linkData.properties.action_link,
    })
  )
  const sent = await sendResend({
    to: target.email,
    subject: 'Je inloglink voor Wittenboer Events',
    html: mail.html,
    text: mail.text,
  })

  await logAudit({
    actorId: admin.id,
    action: 'staff.invited',
    entity: 'profile',
    entityId: id,
    metadata: { email: target.email, mailSent: sent.ok, mailError: sent.error },
  })

  if (!sent.ok) {
    return NextResponse.json(
      { error: 'Inloglink kon niet worden verstuurd.', detail: sent.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, mailSent: true })
}
