import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { AuthError, requireAdmin } from '../../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../../lib/db/server'
import { logAudit } from '../../../../../lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

// Geeft de admin de persoonlijke agenda-feed-link van een crewlid terug via de
// service-role, zodat het token niet meer via een client-select in de browser
// belandt. Met body { rotate: true } wordt een nieuw token gezet en de oude
// link ongeldig gemaakt (intrekken).
export async function POST(request: Request, context: RouteContext) {
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

  let rotate = false
  try {
    const body = await request.json()
    rotate = body?.rotate === true
  } catch {
    // Geen body betekent gewoon ophalen.
  }

  const supabase = createSupabaseAdminClient()

  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role, calendar_feed_token')
    .eq('id', id)
    .maybeSingle()
  if (targetErr) {
    return NextResponse.json({ error: 'Ophalen faalde.' }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: 'Crewlid niet gevonden.' }, { status: 404 })
  }
  if (target.role !== 'staff') {
    return NextResponse.json({ error: 'Dit account is geen crewlid.' }, { status: 403 })
  }

  let token = target.calendar_feed_token
  if (rotate || !token) {
    token = randomBytes(24).toString('hex')
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ calendar_feed_token: token })
      .eq('id', id)
    if (updateErr) {
      return NextResponse.json({ error: 'Agenda-link opslaan faalde.' }, { status: 500 })
    }
    await logAudit({
      actorId: admin.id,
      action: 'staff.calendar_link',
      entity: 'profile',
      entityId: id,
      metadata: { rotated: rotate },
    })
  }

  const url = `${siteUrl}/api/calendar/${token}.ics`
  return NextResponse.json({ url, rotated: rotate })
}
