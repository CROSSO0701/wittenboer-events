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
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: input.email,
    options: { redirectTo, data: { full_name: input.full_name } },
  })
  if (linkErr || !linkData?.user || !linkData.properties?.action_link) {
    return NextResponse.json({ error: 'Uitnodigen faalde.', detail: linkErr?.message }, { status: 500 })
  }

  await supabase
    .from('profiles')
    .update({ role: 'staff', full_name: input.full_name, phone: input.phone ?? null })
    .eq('id', linkData.user.id)

  const mail = await renderEmail(
    InviteMail({ name: input.full_name, role: 'crewlid', link: linkData.properties.action_link })
  )
  const sent = await sendResend({
    to: input.email,
    subject: 'Welkom bij Wittenboer Events',
    html: mail.html,
    text: mail.text,
  })

  await logAudit({
    actorId: admin.id,
    action: 'staff.invited',
    entity: 'profile',
    entityId: linkData.user.id,
    metadata: { email: input.email, mailSent: sent.ok, mailError: sent.error },
  })

  return NextResponse.json({ ok: true, user_id: linkData.user.id, mailSent: sent.ok, mailError: sent.error })
}
