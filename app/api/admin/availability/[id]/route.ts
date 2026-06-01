import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { updateAvailabilitySchema } from '../../../../lib/schemas/planning'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  let input
  try {
    input = updateAvailabilitySchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('crew_availability')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Periode niet gevonden.' }, { status: 404 })
  }

  const startDate = input.start_date ?? existing.start_date
  const endDate = input.end_date ?? existing.end_date
  if (endDate < startDate) {
    return NextResponse.json({ error: 'Einddatum mag niet vóór de startdatum liggen.' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue
    update[k] = v
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, availability: existing, changed: false })
  }

  const { data: updated, error: updErr } = await supabase
    .from('crew_availability')
    .update(update as never)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (updErr || !updated) {
    return NextResponse.json({ error: 'Bijwerken faalde.', detail: updErr?.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'availability.updated',
    entity: 'crew_availability',
    entityId: id,
  })

  return NextResponse.json({ ok: true, availability: updated })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await params
  const supabase = createSupabaseAdminClient()

  const { error: delErr } = await supabase.from('crew_availability').delete().eq('id', id)
  if (delErr) {
    return NextResponse.json({ error: 'Verwijderen faalde.', detail: delErr.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'availability.deleted',
    entity: 'crew_availability',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
