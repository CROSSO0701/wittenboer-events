import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createKlusSchema } from '../../../lib/schemas/planning'
import { AuthError, requireAdmin } from '../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { createEvent, createEventIn } from '../../../lib/integrations/google-calendar'
import { logAudit } from '../../../lib/audit'
import { findKlusConflicts } from '../../../lib/booking-conflicts'

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
    input = createKlusSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const staffIds = (input.assignments ?? []).map((a) => a.staff_id)

  // Dubbelboeking-check vóór aanmaken (nieuwe klus heeft nog geen id om uit te sluiten).
  const conflicts = await findKlusConflicts(supabase, {
    klusId: '00000000-0000-0000-0000-000000000000',
    eventDate: input.event_date,
    staffIds,
  })
  if (conflicts.length > 0 && !input.override_overlap) {
    return NextResponse.json(
      { error: 'Mogelijke dubbelboeking, controleer en bevestig om door te gaan.', conflicts },
      { status: 409 }
    )
  }

  const { data: klus, error: insertErr } = await supabase
    .from('klussen')
    .insert({
      title: input.title,
      kind: input.kind,
      event_date: input.event_date,
      event_start: input.event_start ?? null,
      event_end: input.event_end ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
      booking_id: input.booking_id ?? null,
      created_by: admin.id,
    })
    .select()
    .maybeSingle()

  if (insertErr || !klus) {
    return NextResponse.json({ error: 'Aanmaken faalde.', detail: insertErr?.message }, { status: 500 })
  }

  if (staffIds.length > 0) {
    const rows = (input.assignments ?? []).map((a) => ({
      klus_id: klus.id,
      staff_id: a.staff_id,
      role_on_job: a.role_on_job ?? null,
      notification_channel: a.notification_channel,
      assigned_by: admin.id,
    }))
    const { error: assignErr } = await supabase
      .from('klus_assignments')
      .upsert(rows, { onConflict: 'klus_id,staff_id' })
    if (assignErr) {
      return NextResponse.json(
        { ok: true, klus, assignWarning: assignErr.message },
        { status: 200 }
      )
    }
  }

  // Google-agenda (best-effort): een ingeplande klus verschijnt automatisch in
  // de agenda. Faalt Google, dan blijft de klus gewoon bestaan (geen error).
  const summary = input.title
  const description = input.notes || undefined
  const location = input.location || undefined
  let created: { ok: boolean; id?: string } | null = null
  if (input.event_start && input.event_end) {
    // Getimed event.
    created = await createEvent({
      summary,
      description,
      location,
      startISO: input.event_start,
      endISO: input.event_end,
    })
  } else if (input.event_date) {
    // Hele-dag-event.
    created = await createEvent({ summary, description, location, allDayDate: input.event_date })
  }
  if (created?.ok && created.id) {
    await supabase.from('klussen').update({ google_event_id: created.id }).eq('id', klus.id)
  }

  // Persoonlijke crew-agenda (best-effort): elk toegewezen crewlid met een eigen
  // Google-agenda krijgt de klus in ZIJN agenda, naast de hoofd-agenda. Faalt
  // Google, dan blijft de klus gewoon bestaan (geen error).
  if (staffIds.length > 0) {
    const { data: crewProfiles } = await supabase
      .from('profiles')
      .select('id, google_calendar_id')
      .in('id', staffIds)
    for (const a of input.assignments ?? []) {
      const profile = crewProfiles?.find((p) => p.id === a.staff_id)
      if (!profile?.google_calendar_id) continue
      const crewDescription = [input.notes, a.role_on_job ? `Rol: ${a.role_on_job}` : null]
        .filter(Boolean)
        .join('\n\n')
      let crewCreated: { ok: boolean; id?: string } | null = null
      if (input.event_start && input.event_end) {
        crewCreated = await createEventIn(profile.google_calendar_id, {
          summary,
          description: crewDescription || undefined,
          location,
          startISO: input.event_start,
          endISO: input.event_end,
        })
      } else if (input.event_date) {
        crewCreated = await createEventIn(profile.google_calendar_id, {
          summary,
          description: crewDescription || undefined,
          location,
          allDayDate: input.event_date,
        })
      }
      if (crewCreated?.ok && crewCreated.id) {
        await supabase
          .from('klus_assignments')
          .update({ google_event_id: crewCreated.id })
          .eq('klus_id', klus.id)
          .eq('staff_id', a.staff_id)
      }
    }
  }

  await logAudit({
    actorId: admin.id,
    action: 'klus.created',
    entity: 'klus',
    entityId: klus.id,
    metadata: { kind: input.kind, crew: staffIds.length },
  })

  return NextResponse.json({ ok: true, klus })
}
