import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { updateBookingSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { patchEvent, calendarTitle } from '../../../../lib/integrations/google-calendar'
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
    input = updateBookingSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, artist:artists(stage_name)')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Boeking niet gevonden.' }, { status: 404 })
  }

  // Bouw update-object met enkel niet-undefined keys
  const update: Record<string, unknown> = {}
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue
    update[k] = v
    if ((existing as Record<string, unknown>)[k] !== v) {
      diff[k] = { from: (existing as Record<string, unknown>)[k] ?? null, to: v }
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, booking: existing, changed: false })
  }

  const { data: updated, error: updErr } = await supabase
    .from('bookings')
    .update(update as never)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (updErr || !updated) {
    return NextResponse.json({ error: 'Update faalde.', detail: updErr?.message }, { status: 500 })
  }

  // Sync naar Google Calendar als time/location wijzigt
  let googleSync: 'patched' | 'skipped' | 'error' = 'skipped'
  let googleError: string | undefined
  if (
    existing.google_event_id &&
    (diff.event_start || diff.event_end || diff.event_location || diff.client_name)
  ) {
    // Behoud de nette agenda-titel (artiest → (crew) → locatie) i.p.v. ruwe client_name
    const { data: assigns } = await supabase
      .from('booking_assignments')
      .select('staff_id')
      .eq('booking_id', id)
    const staffIds = (assigns ?? []).map((a) => a.staff_id)
    let staffNames: string[] = []
    if (staffIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('full_name').in('id', staffIds)
      staffNames = (profs ?? []).map((p) => p.full_name).filter((n): n is string => !!n)
    }
    const summary = calendarTitle({
      source: existing.source,
      clientName: updated.client_name ?? existing.client_name,
      artistName: existing.artist?.stage_name ?? null,
      staffNames,
    })
    const result = await patchEvent(existing.google_event_id, {
      summary,
      location: updated.event_location ?? undefined,
      startISO: updated.event_start ?? undefined,
      endISO: updated.event_end ?? undefined,
    })
    if (result.ok) googleSync = 'patched'
    else {
      googleSync = 'error'
      googleError = result.error
    }
  }

  await logAudit({
    actorId: admin.id,
    action: 'booking.updated',
    entity: 'booking',
    entityId: id,
    metadata: { diff, googleSync },
  })

  return NextResponse.json({ ok: true, booking: updated, googleSync, googleError })
}
