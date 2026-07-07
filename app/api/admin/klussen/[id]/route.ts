import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { updateKlusSchema } from '../../../../lib/schemas/planning'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import {
  createEvent,
  patchEvent,
  deleteEvent,
  createEventIn,
  deleteEventFrom,
} from '../../../../lib/integrations/google-calendar'
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
        { error: 'Mogelijke dubbelboeking, controleer en bevestig om door te gaan.', conflicts },
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
    // Bestaande toewijzingen + hun persoonlijke agenda-events ophalen zodat we
    // die events kunnen opruimen (best-effort) voordat we de set vervangen.
    const { data: priorAssigns } = await supabase
      .from('klus_assignments')
      .select('staff_id, google_event_id')
      .eq('klus_id', id)
    const prior = priorAssigns ?? []
    if (prior.length > 0) {
      const priorStaffIds = prior.map((a) => a.staff_id)
      const { data: priorProfiles } = await supabase
        .from('profiles')
        .select('id, google_calendar_id')
        .in('id', priorStaffIds)
      const calById = new Map<string, string | null>(
        (priorProfiles ?? []).map((p) => [p.id, p.google_calendar_id])
      )
      for (const a of prior) {
        const cal = calById.get(a.staff_id)
        if (cal && a.google_event_id) {
          await deleteEventFrom(cal, a.google_event_id)
        }
      }
    }

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

  // Google-agenda synchroniseren op basis van de NIEUWE waarden (best-effort).
  // Faalt Google, dan blijft de klus-wijziging gewoon staan (geen error).
  const summary = klus.title
  const description = klus.notes || undefined
  const location = klus.location || undefined
  const timing =
    klus.event_start && klus.event_end
      ? { startISO: klus.event_start, endISO: klus.event_end }
      : klus.event_date
        ? { allDayDate: klus.event_date }
        : {}
  if (klus.google_event_id) {
    // Bestaand agenda-item bijwerken.
    await patchEvent(klus.google_event_id, { summary, location, description, ...timing })
  } else if (klus.event_start || klus.event_date) {
    // Nog geen agenda-item: alsnog aanmaken (ook voor eerder aangemaakte klussen).
    const created = await createEvent({ summary, description, location, ...timing })
    if (created.ok && created.id) {
      await supabase.from('klussen').update({ google_event_id: created.id }).eq('id', id)
    }
  }

  // Persoonlijke crew-agenda (best-effort): de (mogelijk nieuwe) toewijzingen in
  // de eigen agenda van elk crewlid zetten, naast de hoofd-agenda. De oude events
  // zijn hierboven al opgeruimd. Alleen als assignments is meegegeven.
  if (assignments && staffIds.length > 0 && (klus.event_start || klus.event_date)) {
    const { data: crewProfiles } = await supabase
      .from('profiles')
      .select('id, google_calendar_id')
      .in('id', staffIds)
    for (const a of assignments) {
      const profile = crewProfiles?.find((p) => p.id === a.staff_id)
      if (!profile?.google_calendar_id) continue
      const crewDescription = [klus.notes, a.role_on_job ? `Rol: ${a.role_on_job}` : null]
        .filter(Boolean)
        .join('\n\n')
      const crewCreated = await createEventIn(profile.google_calendar_id, {
        summary,
        description: crewDescription || undefined,
        location,
        ...timing,
      })
      if (crewCreated.ok && crewCreated.id) {
        await supabase
          .from('klus_assignments')
          .update({ google_event_id: crewCreated.id })
          .eq('klus_id', id)
          .eq('staff_id', a.staff_id)
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

  // Haal het gekoppelde agenda-item op zodat we het mee kunnen opruimen.
  const { data: existing } = await supabase
    .from('klussen')
    .select('google_event_id')
    .eq('id', id)
    .maybeSingle()

  // Persoonlijke crew-agenda-events ophalen VOOR het verwijderen (klus_assignments
  // kan meecascaden), zodat we die events uit de eigen agenda's kunnen opruimen.
  const { data: crewAssigns } = await supabase
    .from('klus_assignments')
    .select('staff_id, google_event_id')
    .eq('klus_id', id)
  const crewToClean = (crewAssigns ?? []).filter((a) => a.google_event_id)
  let crewCalById = new Map<string, string | null>()
  if (crewToClean.length > 0) {
    const { data: crewProfiles } = await supabase
      .from('profiles')
      .select('id, google_calendar_id')
      .in(
        'id',
        crewToClean.map((a) => a.staff_id)
      )
    crewCalById = new Map((crewProfiles ?? []).map((p) => [p.id, p.google_calendar_id]))
  }

  const { error: delErr } = await supabase.from('klussen').delete().eq('id', id)
  if (delErr) {
    return NextResponse.json({ error: 'Verwijderen faalde.', detail: delErr.message }, { status: 500 })
  }

  // Agenda-item verwijderen (best-effort): faalt Google, dan is de klus toch weg.
  if (existing?.google_event_id) {
    await deleteEvent(existing.google_event_id)
  }

  // Persoonlijke crew-agenda-events opruimen (best-effort).
  for (const a of crewToClean) {
    const cal = crewCalById.get(a.staff_id)
    if (cal && a.google_event_id) {
      await deleteEventFrom(cal, a.google_event_id)
    }
  }

  await logAudit({ actorId: admin.id, action: 'klus.deleted', entity: 'klus', entityId: id })

  return NextResponse.json({ ok: true })
}
