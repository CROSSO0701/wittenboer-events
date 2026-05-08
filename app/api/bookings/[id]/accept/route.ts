import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { acceptBookingSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { createEvent, listOverlapping } from '../../../../lib/integrations/google-calendar'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { BookingAcceptedMail } from '../../../../lib/email/templates/booking-accepted'
import { logAudit } from '../../../../lib/audit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wittenboerevents.nl'

function formatEUR(cents?: number | null): string | undefined {
  if (cents == null) return undefined
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function dayBoundsISO(date: string): { startISO: string; endISO: string } {
  // Hele dag in lokale TZ benadering — we vragen GCal events in [date 00:00, date+1 00:00].
  return {
    startISO: `${date}T00:00:00+02:00`,
    endISO: `${date}T23:59:59+02:00`,
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

  let body: unknown = {}
  try {
    body = await request.json().catch(() => ({}))
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  let input
  try {
    input = acceptBookingSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, artist:artists(stage_name, profile_id)')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: 'Database-fout.' }, { status: 500 })
  if (!booking) return NextResponse.json({ error: 'Boeking niet gevonden.' }, { status: 404 })
  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: `Boeking heeft status "${booking.status}" en kan niet meer geaccepteerd worden.` },
      { status: 409 }
    )
  }

  // Overlap check tegen Google Calendar
  let conflicts: Array<{ id: string; summary: string; startISO: string; endISO: string }> = []
  if (booking.event_date) {
    const { startISO, endISO } = dayBoundsISO(booking.event_date)
    const overlap = await listOverlapping(startISO, endISO)
    conflicts = overlap.events
  }

  if (conflicts.length > 0 && !input.override_overlap) {
    return NextResponse.json(
      {
        error: 'Er staan al events op deze datum. Stuur opnieuw met override_overlap=true om door te gaan.',
        conflicts,
      },
      { status: 409 }
    )
  }

  // Maak Google event (best effort)
  let googleEventId: string | null = null
  let googleError: string | undefined
  if (booking.event_start && booking.event_end) {
    const summary = booking.client_name
      ? `${booking.client_name}${booking.artist?.stage_name ? ` — ${booking.artist.stage_name}` : ''}`
      : booking.artist?.stage_name ?? 'Boeking'
    const created = await createEvent({
      summary,
      description: booking.notes ?? undefined,
      location: booking.event_location ?? undefined,
      startISO: booking.event_start,
      endISO: booking.event_end,
    })
    if (created.ok && created.id) {
      googleEventId = created.id
    } else {
      googleError = created.error
    }
  } else {
    googleError = 'Geen event_start/event_end op de booking; agenda overgeslagen.'
  }

  // Update booking
  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update({
      status: 'accepted',
      decided_at: new Date().toISOString(),
      decided_by: admin.id,
      google_event_id: googleEventId,
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (updateErr || !updated) {
    return NextResponse.json({ error: 'Booking-update faalde.' }, { status: 500 })
  }

  // Optionele staff-toewijzingen
  if (input.staff_ids && input.staff_ids.length > 0) {
    const rows = input.staff_ids.map((sid) => ({
      booking_id: id,
      staff_id: sid,
      assigned_by: admin.id,
    }))
    await supabase.from('booking_assignments').upsert(rows, { onConflict: 'booking_id,staff_id' })
  }

  // Mail naar artiest
  if (booking.artist?.profile_id) {
    const { data: artistProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.artist.profile_id)
      .maybeSingle()
    if (artistProfile?.email) {
      const html = await renderEmail(
        BookingAcceptedMail({
          artistName: artistProfile.full_name || booking.artist.stage_name,
          clientName: booking.client_name ?? '(geen naam)',
          eventDate: booking.event_date ?? 'n.t.b.',
          eventLocation: booking.event_location ?? 'n.t.b.',
          feeFormatted: formatEUR(booking.fee_cents),
          notes: booking.notes ?? undefined,
          portalUrl: `${SITE_URL}/portal/artiest`,
        })
      )
      await sendResend({
        to: artistProfile.email,
        subject: `Klus geaccepteerd · ${booking.event_date ?? ''}`,
        html: html.html,
        text: html.text,
      })
    }
  }

  await logAudit({
    actorId: admin.id,
    action: 'booking.accepted',
    entity: 'booking',
    entityId: id,
    metadata: { googleEventId, hadConflicts: conflicts.length > 0 },
  })

  return NextResponse.json({
    ok: true,
    booking: updated,
    googleEventId,
    googleError,
    conflicts,
  })
}
