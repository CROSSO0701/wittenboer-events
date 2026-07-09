import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'
import { deleteCalendar } from '../../../../lib/integrations/google-calendar'
import type { Database } from '../../../../lib/db/types.generated'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Zelfde e-mail-normalisatie als inviteStaffSchema: trim + lowercase.
const patchSchema = z.object({
  full_name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().toLowerCase().email().max(320).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

function friendlyAuthError(msg?: string | null): string {
  if (!msg) return 'E-mail wijzigen faalde.'
  const m = msg.toLowerCase()
  if (m.includes('already') || m.includes('registered') || m.includes('exists')) {
    return 'Deze e-mail heeft al een account.'
  }
  return `E-mail wijzigen faalde: ${msg}`
}

export async function PATCH(request: Request, context: RouteContext) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige invoer.', issues: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data

  const supabase = createSupabaseAdminClient()

  // Doelprofiel ophalen en valideren dat het echt een crewlid is.
  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role, email')
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

  // E-mailwijziging: enkel doorvoeren als het adres echt verandert (case-insensitief).
  const emailChanged =
    d.email !== undefined && d.email !== (target.email ?? '').trim().toLowerCase()

  if (emailChanged) {
    // Voorkom drift: check of een ander contact dit adres al gebruikt.
    const { data: clash, error: clashErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', d.email as string)
      .neq('id', id)
      .maybeSingle()
    if (clashErr) {
      return NextResponse.json({ error: 'Controle faalde.', detail: clashErr.message }, { status: 500 })
    }
    if (clash) {
      return NextResponse.json(
        { error: 'Deze e-mail is al in gebruik door een ander contact.' },
        { status: 409 }
      )
    }

    // Het interne auth.users-record moet meeveranderen, anders matcht de
    // invite-route (die op profiles.email matcht) straks niet meer.
    const { error: authErr } = await supabase.auth.admin.updateUserById(id, {
      email: d.email as string,
      email_confirm: true,
    })
    if (authErr) {
      return NextResponse.json(
        { error: friendlyAuthError(authErr.message), detail: authErr.message },
        { status: 400 }
      )
    }
  }

  // profiles-update opbouwen met alleen de meegegeven velden.
  const updates: ProfileUpdate = {}
  if (d.full_name !== undefined) updates.full_name = d.full_name
  if (d.phone !== undefined) updates.phone = d.phone === '' ? null : d.phone
  if (d.email !== undefined) updates.email = d.email

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Niets om bij te werken.' }, { status: 400 })
  }

  const { data: updated, error: updateErr } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (updateErr || !updated) {
    return NextResponse.json(
      { error: 'Profiel bijwerken faalde.', detail: updateErr?.message },
      { status: 500 }
    )
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.updated',
    entity: 'profile',
    entityId: id,
    metadata: { fields: Object.keys(updates) },
  })

  return NextResponse.json({ ok: true })
}

// Archiveert een crewlid: het verdwijnt uit de crew-lijst, agenda en toekomstige
// toewijzingen, zijn login wordt geblokkeerd en zijn persoonlijke Google-agenda
// wordt verwijderd. Op AFGERONDE (verleden) klussen blijft de toewijzing staan,
// zodat het archief bewaart wie erbij was. Onomkeerbaar voor de Google-agenda.
export async function DELETE(_request: Request, context: RouteContext) {
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

  const supabase = createSupabaseAdminClient()

  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role, google_calendar_id, archived_at')
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
  if (target.archived_at) {
    return NextResponse.json({ ok: true, alreadyArchived: true })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Toekomstige toewijzingen van dit crewlid verwijderen; strikt verleden blijft
  // staan voor het archief. We halen de toekomstige boekingen/klussen los op en
  // snijden die met de toewijzingen van dit crewlid (voorkomt afhankelijkheid van
  // geneste-relatie-typing).
  const [futureBookings, futureKlussen, myBookingAssigns, myKlusAssigns] = await Promise.all([
    supabase.from('bookings').select('id').gte('event_date', today),
    supabase.from('klussen').select('id').gte('event_date', today),
    supabase.from('booking_assignments').select('booking_id').eq('staff_id', id),
    supabase.from('klus_assignments').select('klus_id').eq('staff_id', id),
  ])

  const futureBookingSet = new Set((futureBookings.data ?? []).map((r) => r.id))
  const futureKlusSet = new Set((futureKlussen.data ?? []).map((r) => r.id))
  const futureBookingIds = (myBookingAssigns.data ?? [])
    .map((r) => r.booking_id)
    .filter((bid) => futureBookingSet.has(bid))
  const futureKlusIds = (myKlusAssigns.data ?? [])
    .map((r) => r.klus_id)
    .filter((kid) => futureKlusSet.has(kid))

  if (futureBookingIds.length > 0) {
    await supabase.from('booking_assignments').delete().eq('staff_id', id).in('booking_id', futureBookingIds)
  }
  if (futureKlusIds.length > 0) {
    await supabase.from('klus_assignments').delete().eq('staff_id', id).in('klus_id', futureKlusIds)
  }

  // Persoonlijke Google-agenda ("Wittenboer · naam") verwijderen (best-effort:
  // een 404/410 telt als opgeruimd). Dit haalt meteen alle crew-events weg.
  let calendarRemoved = false
  if (target.google_calendar_id) {
    const res = await deleteCalendar(target.google_calendar_id)
    calendarRemoved = res.ok
  }

  // Profiel markeren als gearchiveerd en alle tokens/koppelingen wissen.
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      archived_at: new Date().toISOString(),
      google_calendar_id: null,
      calendar_feed_token: null,
      login_link_token: null,
      login_link_expires_at: null,
    })
    .eq('id', id)
  if (updateErr) {
    return NextResponse.json({ error: 'Archiveren faalde.', detail: updateErr.message }, { status: 500 })
  }

  // Login blokkeren: de auth-user bannen zodat inloggen (link of wachtwoord) faalt.
  try {
    await supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' })
  } catch (err) {
    console.error('[staff.archived] ban faalde', err instanceof Error ? err.message : err)
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.archived',
    entity: 'profile',
    entityId: id,
    metadata: {
      removedBookingAssignments: futureBookingIds.length,
      removedKlusAssignments: futureKlusIds.length,
      calendarRemoved,
    },
  })

  return NextResponse.json({ ok: true, calendarRemoved })
}
