import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { InviteMail } from '../../../../lib/email/templates/invite'
import { inviteStaffSchema } from '../../../../lib/schemas/invite'
import { logAudit } from '../../../../lib/audit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function friendlyAuthError(msg?: string | null): string {
  if (!msg) return 'Uitnodigen faalde.'
  const m = msg.toLowerCase()
  if (m.includes('already') && (m.includes('registered') || m.includes('exists'))) {
    return 'Deze e-mail heeft al een account. Laat ze inloggen op /portal/login.'
  }
  if (m.includes('rate limit')) {
    return 'Te veel invites verstuurd. Probeer over een uur opnieuw, of stel Resend in voor onbeperkte mail.'
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Ongeldig e-mailadres.'
  }
  return `Uitnodigen faalde: ${msg}`
}

export async function POST(request: Request) {
  let admin
  try {
    admin = await requireAdmin()
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
    input = inviteStaffSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Niet alle velden zijn correct ingevuld.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const redirectTo = `${SITE_URL}/portal/account?welcome=1`
  const useResend = !!process.env.RESEND_API_KEY

  let userId: string | undefined
  let actionLink: string | undefined
  let reusedExisting = false

  {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', input.email)
      .maybeSingle()
    if (existingProfile?.id) {
      userId = existingProfile.id
      reusedExisting = true
    }
  }

  if (!reusedExisting) {
    if (useResend) {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: input.email,
        options: { redirectTo, data: { full_name: input.full_name } },
      })
      if (linkErr || !linkData?.user || !linkData.properties?.action_link) {
        return NextResponse.json(
          { error: friendlyAuthError(linkErr?.message), detail: linkErr?.message },
          { status: 500 }
        )
      }
      userId = linkData.user.id
      actionLink = linkData.properties.action_link
    } else {
      const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
        input.email,
        { redirectTo, data: { full_name: input.full_name } }
      )
      if (inviteErr || !inviteData?.user) {
        return NextResponse.json(
          { error: friendlyAuthError(inviteErr?.message), detail: inviteErr?.message },
          { status: 500 }
        )
      }
      userId = inviteData.user.id
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Onvolledige invite-respons.' }, { status: 500 })
  }

  await supabase
    .from('profiles')
    .update({ role: 'staff', full_name: input.full_name, phone: input.phone ?? null })
    .eq('id', userId)

  let sent: { ok: boolean; error?: string } = { ok: true }
  if (useResend && actionLink) {
    const mail = await renderEmail(
      InviteMail({ name: input.full_name, role: 'crewlid', link: actionLink })
    )
    sent = await sendResend({
      to: input.email,
      subject: 'Welkom bij Wittenboer Events',
      html: mail.html,
      text: mail.text,
    })
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.invited',
    entity: 'profile',
    entityId: userId,
    metadata: {
      email: input.email,
      via: useResend ? 'resend' : 'supabase',
      mailSent: sent.ok,
      mailError: sent.error,
    },
  })

  return NextResponse.json({
    ok: true,
    user_id: userId,
    mailSent: sent.ok,
    mailError: sent.error,
    via: useResend ? 'resend' : 'supabase',
  })
}
