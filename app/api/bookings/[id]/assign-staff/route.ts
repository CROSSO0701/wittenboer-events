import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { assignStaffSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import {
  patchEvent,
  calendarTitle,
  createEventIn,
} from '../../../../lib/integrations/google-calendar'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { StaffAssignedMail } from '../../../../lib/email/templates/staff-assigned'
import { logAudit } from '../../../../lib/audit'
import { findBookingConflicts } from '../../../../lib/booking-conflicts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wittenboerevents.nl'
const CALLMEBOT_KEY = process.env.CALLMEBOT_API_KEY

async function sendWhatsapp(toPhone: string, message: string): Promise<boolean> {
  if (!CALLMEBOT_KEY) return false
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      toPhone.replace(/[^0-9+]/g, '')
    )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(CALLMEBOT_KEY)}`
    const res = await fetch(url)
    return res.ok
  } catch {
    return false
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    input = assignStaffSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, artist:artists(stage_name)')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: 'Database-fout.' }, { status: 500 })
  if (!booking) return NextResponse.json({ error: 'Boeking niet gevonden.' }, { status: 404 })

  // Dubbelboeking-check: staat een gekozen schuiver die dag al op een andere klus?
  const conflicts = await findBookingConflicts(supabase, {
    bookingId: id,
    eventDate: booking.event_date,
    staffIds: input.assignments.map((a) => a.staff_id),
  })
  if (conflicts.length > 0 && !input.override_overlap) {
    return NextResponse.json(
      { error: 'Mogelijke dubbelboeking, controleer en bevestig om door te gaan.', conflicts },
      { status: 409 }
    )
  }

  // Bestaande toewijzingen ophalen: zo weten we welke crew NIEUW is (en dus een
  // event in de eigen agenda moet krijgen) en welke al een event heeft.
  const { data: priorAssigns } = await supabase
    .from('booking_assignments')
    .select('staff_id, google_event_id')
    .eq('booking_id', id)
  const priorEventByStaff = new Map<string, string | null>(
    (priorAssigns ?? []).map((a) => [a.staff_id, a.google_event_id])
  )

  // Upsert assignments
  const rows = input.assignments.map((a) => ({
    booking_id: id,
    staff_id: a.staff_id,
    role_on_job: a.role_on_job,
    notification_channel: a.notification_channel,
    assigned_by: admin.id,
  }))
  const { error: upsertErr } = await supabase
    .from('booking_assignments')
    .upsert(rows, { onConflict: 'booking_id,staff_id' })

  if (upsertErr) {
    return NextResponse.json({ error: 'Toewijzen faalde.', detail: upsertErr.message }, { status: 500 })
  }

  // Zet de toegewezen crew als "(naam, naam)" achter de agenda-titel.
  if (booking.google_event_id) {
    const { data: allAssigns } = await supabase
      .from('booking_assignments')
      .select('staff_id')
      .eq('booking_id', id)
    const ids = (allAssigns ?? []).map((a) => a.staff_id)
    let staffNames: string[] = []
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('full_name').in('id', ids)
      staffNames = (profs ?? []).map((p) => p.full_name).filter((n): n is string => !!n)
    }
    await patchEvent(booking.google_event_id, {
      summary: calendarTitle({
        source: booking.source,
        clientName: booking.client_name,
        artistName: booking.artist?.stage_name ?? null,
        staffNames,
      }),
    })
  }

  // Notify per staff member
  const staffIds = input.assignments.map((a) => a.staff_id)
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, google_calendar_id')
    .in('id', staffIds)

  // Persoonlijke crew-agenda (best-effort): elk NIEUW toegewezen crewlid met een
  // eigen Google-agenda krijgt de klus in ZIJN agenda. Faalt Google, dan blijft
  // de toewijzing gewoon bestaan (geen error). Gebeurt naast de hoofd-agenda.
  const personalSummary = calendarTitle({
    source: booking.source,
    clientName: booking.client_name,
    artistName: booking.artist?.stage_name ?? null,
  })
  for (const a of input.assignments) {
    const profile = staffProfiles?.find((p) => p.id === a.staff_id)
    if (!profile?.google_calendar_id) continue
    // Al een event voor dit crewlid op deze boeking? Dan niet dubbel aanmaken.
    if (priorEventByStaff.get(a.staff_id)) continue

    const description = [booking.notes, a.role_on_job ? `Rol: ${a.role_on_job}` : null]
      .filter(Boolean)
      .join('\n\n')
    let created: { ok: boolean; id?: string } | null = null
    if (booking.event_start && booking.event_end) {
      created = await createEventIn(profile.google_calendar_id, {
        summary: personalSummary,
        description: description || undefined,
        location: booking.event_location ?? undefined,
        startISO: booking.event_start,
        endISO: booking.event_end,
      })
    } else if (booking.event_date) {
      created = await createEventIn(profile.google_calendar_id, {
        summary: personalSummary,
        description: description || undefined,
        location: booking.event_location ?? undefined,
        allDayDate: booking.event_date,
      })
    }
    if (created?.ok && created.id) {
      await supabase
        .from('booking_assignments')
        .update({ google_event_id: created.id })
        .eq('booking_id', id)
        .eq('staff_id', a.staff_id)
    }
  }

  const notifyResults: Array<{ staff_id: string; ok: boolean; channel: string; error?: string }> = []
  for (const a of input.assignments) {
    const profile = staffProfiles?.find((p) => p.id === a.staff_id)
    if (!profile) {
      notifyResults.push({ staff_id: a.staff_id, ok: false, channel: a.notification_channel, error: 'profile-not-found' })
      continue
    }
    const portalUrl = `${SITE_URL}/portal/staff`
    if (a.notification_channel === 'email' && profile.email) {
      const html = await renderEmail(
        StaffAssignedMail({
          staffName: profile.full_name || 'collega',
          artistName: booking.artist?.stage_name,
          clientName: booking.client_name ?? '(geen naam)',
          eventDate: booking.event_date ?? 'n.t.b.',
          eventLocation: booking.event_location ?? 'n.t.b.',
          roleOnJob: a.role_on_job,
          notes: booking.notes ?? undefined,
          portalUrl,
        })
      )
      const sent = await sendResend({
        to: profile.email,
        subject: `Ingepland · ${booking.event_date ?? ''}`,
        html: html.html,
        text: html.text,
      })
      notifyResults.push({ staff_id: a.staff_id, ok: sent.ok, channel: 'email', error: sent.error })
    } else if (a.notification_channel === 'whatsapp' && profile.phone) {
      const msg = `Ingepland: ${booking.event_date ?? ''} · ${booking.event_location ?? ''}${
        booking.artist?.stage_name ? ` · ${booking.artist.stage_name}` : ''
      }`
      const ok = await sendWhatsapp(profile.phone, msg)
      notifyResults.push({ staff_id: a.staff_id, ok, channel: 'whatsapp' })
    } else {
      notifyResults.push({ staff_id: a.staff_id, ok: false, channel: a.notification_channel, error: 'no-contact' })
    }

    // Mark notified_at
    if (notifyResults[notifyResults.length - 1]!.ok) {
      await supabase
        .from('booking_assignments')
        .update({ notified_at: new Date().toISOString() })
        .eq('booking_id', id)
        .eq('staff_id', a.staff_id)
    }
  }

  await logAudit({
    actorId: admin.id,
    action: 'booking.assigned',
    entity: 'booking',
    entityId: id,
    metadata: { count: input.assignments.length, channels: input.assignments.map((a) => a.notification_channel) },
  })

  return NextResponse.json({ ok: true, notifications: notifyResults })
}
