import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createAvailabilitySchema } from '../../../lib/schemas/planning'
import { AuthError, requireAdmin } from '../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { logAudit } from '../../../lib/audit'

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
    input = createAvailabilitySchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const { data: row, error: insertErr } = await supabase
    .from('crew_availability')
    .insert({
      staff_id: input.staff_id,
      start_date: input.start_date,
      end_date: input.end_date,
      kind: input.kind,
      note: input.note ?? null,
      created_by: admin.id,
    })
    .select()
    .maybeSingle()

  if (insertErr || !row) {
    return NextResponse.json({ error: 'Opslaan faalde.', detail: insertErr?.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'availability.created',
    entity: 'crew_availability',
    entityId: row.id,
    metadata: { staff_id: input.staff_id, kind: input.kind },
  })

  return NextResponse.json({ ok: true, availability: row })
}
