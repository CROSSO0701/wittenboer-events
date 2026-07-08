import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { AuthError, requireAdmin } from '../../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../../lib/db/server'
import { logAudit } from '../../../../../lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

// Genereert een deelbare, 24 uur geldige en herbruikbare inloglink voor een
// crewlid. De admin kan die via bijv. WhatsApp sturen. De link zet een verse
// sessie via /api/auth/link. Overschrijft een eventueel bestaand token.
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL ontbreekt.' }, { status: 500 })
  }

  const supabase = createSupabaseAdminClient()

  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role')
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

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ login_link_token: token, login_link_expires_at: expiresAt })
    .eq('id', id)
  if (updateErr) {
    return NextResponse.json({ error: 'Inloglink opslaan faalde.', detail: updateErr.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.login_link',
    entity: 'profile',
    entityId: id,
    metadata: { expiresAt },
  })

  const url = `${siteUrl}/api/auth/link?token=${token}`
  return NextResponse.json({ url })
}
