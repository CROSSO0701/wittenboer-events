import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'

const schema = z.object({ artist_id: z.string().uuid() })

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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige invoer.', issues: parsed.error.issues }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('artists')
    .update({ profile_id: null })
    .eq('id', parsed.data.artist_id)
  if (error) {
    return NextResponse.json({ error: 'Loskoppelen faalde.', detail: error.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'artist.access_revoked',
    entity: 'artist',
    entityId: parsed.data.artist_id,
  })

  return NextResponse.json({ ok: true })
}
