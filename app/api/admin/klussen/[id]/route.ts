import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { updateKlusSchema } from '../../../../lib/schemas/planning'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'
import { findKlusConflicts } from '../../../../lib/booking-conflicts'

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
    input = updateKlusSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('klussen')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Klus niet gevonden.' }, { status: 404 })
  }

  const { assignments, override_overlap, ...fields } = input
  const staffIds = (assignments ?? []).map((a) => a.staff_id)
  const eventDate = fields.event_date ?? existing.event_date

  // Dubbelboeking-check op de (mogelijk nieuwe) datum + crew.
  if (staffIds.length > 0) {
    const conflicts = await findKlusConflicts(supabase, { klusId: id, eventDate, staffIds })
    if (conflicts.length > 0 && !override_overlap) {
      return NextResponse.json(
        { error: 'Mogelijke dubbelboeking — controleer en bevestig om door te gaan.', conflicts },
        { status: 409 }
      )
    }
  }

  // Bouw update-object met enkel niet-undefined keys.
  const update: Record<string, unknown> = {}
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue
    update[k] = v
    if ((existing as Record<string, unknown>)[k] !== v) {
      diff[k] = { from: (existing as Record<string, unknown>)[k] ?? null, to: v }
    }
  }

  let klus = existing
  if (Object.keys(update).length > 0) {
    const { data: updated, error: updErr } = await supabase
      .from('klussen')
      .update(update as never)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (updErr || !updated) {
      return NextResponse.json({ error: 'Bijwerken faalde.', detail: updErr?.message }, { status: 500 })
    }
    klus = updated
  }

  // Crew opnieuw zetten als assignments is meegegeven (vervangt de set volledig).
  if (assignments) {
    await supabase.from('klus_assignments').delete().eq('klus_id', id)
    if (staffIds.length > 0) {
      const rows = assignments.map((a) => ({
        klus_id: id,
        staff_id: a.staff_id,
        role_on_job: a.role_on_job ?? null,
        notification_channel: a.notification_channel,
        assigned_by: admin.id,
      }))
      const { error: assignErr } = await supabase
        .from('klus_assignments')
        .upsert(rows, { onConflict: 'klus_id,staff_id' })
      if (assignErr) {
        return NextResponse.json({ ok: true, klus, assignWarning: assignErr.message }, { status: 200 })
      }
    }
  }

  await logAudit({
    actorId: admin.id,
    action: 'klus.updated',
    entity: 'klus',
    entityId: id,
    metadata: { diff, crew: assignments ? staffIds.length : undefined },
  })

  return NextResponse.json({ ok: true, klus })
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

  const { error: delErr } = await supabase.from('klussen').delete().eq('id', id)
  if (delErr) {
    return NextResponse.json({ error: 'Verwijderen faalde.', detail: delErr.message }, { status: 500 })
  }

  await logAudit({ actorId: admin.id, action: 'klus.deleted', entity: 'klus', entityId: id })

  return NextResponse.json({ ok: true })
}
