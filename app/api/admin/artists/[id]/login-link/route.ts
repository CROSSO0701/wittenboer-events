import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { AuthError, requireAdmin } from '../../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../../lib/db/server'
import { logAudit } from '../../../../../lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

// Genereert een deelbare, 24 uur geldige en herbruikbare inloglink voor een
// artiest. De admin kan die via bijv. WhatsApp sturen. Zoekt het gekoppelde
// profiel op via de artiest-ID. Overschrijft een eventueel bestaand token.
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
    return NextResponse.json({ error: 'Ongeldige artiest-ID.' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL ontbreekt.' }, { status: 500 })
  }

  const supabase = createSupabaseAdminClient()

  const { data: artist, error: artistErr } = await supabase
    .from('artists')
    .select('id, profile_id')
    .eq('id', id)
    .maybeSingle()
  if (artistErr) {
    return NextResponse.json({ error: 'Ophalen faalde.', detail: artistErr.message }, { status: 500 })
  }
  if (!artist) {
    return NextResponse.json({ error: 'Artiest niet gevonden.' }, { status: 404 })
  }
  if (!artist.profile_id) {
    return NextResponse.json(
      { error: 'Deze artiest heeft nog geen toegang. Geef eerst toegang via "Toegang geven".' },
      { status: 400 }
    )
  }

  // Nooit een deelbare inloglink voor een admin-account (defense-in-depth).
  const { data: linkedProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', artist.profile_id)
    .maybeSingle()
  if (linkedProfile?.role === 'admin') {
    return NextResponse.json({ error: 'Kan geen inloglink maken voor een admin-account.' }, { status: 403 })
  }

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ login_link_token: token, login_link_expires_at: expiresAt })
    .eq('id', artist.profile_id)
  if (updateErr) {
    return NextResponse.json({ error: 'Inloglink opslaan faalde.', detail: updateErr.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'artist.login_link',
    entity: 'artist',
    entityId: id,
    metadata: { profileId: artist.profile_id, expiresAt },
  })

  const url = `${siteUrl}/api/auth/link?token=${token}`
  return NextResponse.json({ url })
}
