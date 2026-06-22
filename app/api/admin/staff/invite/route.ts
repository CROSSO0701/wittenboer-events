import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { inviteStaffSchema } from '../../../../lib/schemas/invite'
import { logAudit } from '../../../../lib/audit'

function friendlyAuthError(msg?: string | null): string {
  if (!msg) return 'Aanmaken faalde.'
  const m = msg.toLowerCase()
  if (m.includes('already') && (m.includes('registered') || m.includes('exists'))) {
    return 'Deze e-mail heeft al een account.'
  }
  if (m.includes('invalid') && m.includes('email')) return 'Ongeldig e-mailadres.'
  return `Aanmaken faalde: ${msg}`
}

// Admin voegt een crewlid toe: een contactrecord (naam, e-mail, optioneel
// telefoon) dat meteen toewijsbaar is aan klussen en bij toewijzing een melding
// krijgt (e-mail/WhatsApp). Er wordt GEEN onboarding- of inlogmail verstuurd en
// crew krijgt geen portaltoegang. Door het datamodel (booking_assignments.staff_id
// verwijst naar auth.users) is achter de schermen wel een minimaal account nodig
// als koppelpunt; dat blijft puur intern en wordt nergens als login gepresenteerd.
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

  // Bestaat dit e-mailadres al? Dan hergebruiken (rol/naam/telefoon bijwerken).
  let userId: string | undefined
  let reused = false
  {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', input.email)
      .maybeSingle()
    if (existing?.id) {
      userId = existing.id
      reused = true
    }
  }

  // Nieuw contact: intern koppelrecord aanmaken (geen wachtwoord, geen mail).
  // email_confirm voorkomt dat Supabase een bevestigings-/inlogmail stuurt.
  if (!reused) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: { full_name: input.full_name },
    })
    if (createErr || !created?.user) {
      return NextResponse.json(
        { error: friendlyAuthError(createErr?.message), detail: createErr?.message },
        { status: 400 }
      )
    }
    userId = created.user.id
  }

  if (!userId) {
    return NextResponse.json({ error: 'Aanmaken faalde.' }, { status: 500 })
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ role: 'staff', full_name: input.full_name, phone: input.phone ?? null, email: input.email })
    .eq('id', userId)
  if (updateErr) {
    return NextResponse.json({ error: 'Profiel opslaan faalde.', detail: updateErr.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.created',
    entity: 'profile',
    entityId: userId,
    metadata: { email: input.email, reused },
  })

  return NextResponse.json({ ok: true, user_id: userId, reused })
}
