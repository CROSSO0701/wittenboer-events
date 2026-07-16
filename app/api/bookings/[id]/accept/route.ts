import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { acceptBookingSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { createEvent, deleteEvent, patchEvent, calendarTitle } from '../../../../lib/integrations/google-calendar'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { BookingAcceptedMail } from '../../../../lib/email/templates/booking-accepted'
import { logAudit } from '../../../../lib/audit'
import { findBookingConflicts } from '../../../../lib/booking-conflicts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wittenboerevents.nl'

function formatEUR(cents?: number | null): string | undefined {
  if (cents == null) return undefined
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
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

  const finalEventDate = input.event_date !== undefined ? input.event_date : booking.event_date
  const finalEventStart = input.event_start !== undefined ? input.event_start : booking.event_start
  const finalEventEnd = input.event_end !== undefined ? input.event_end : booking.event_end
  const finalEventLocation =
    input.event_location !== undefined ? input.event_location : booking.event_location
  const finalNotes = input.notes !== undefined ? input.notes : booking.notes

  // Controleer de definitieve datum die in dezelfde aanvraag wordt opgeslagen.
  const conflicts = await findBookingConflicts(supabase, {
    bookingId: id,
    eventDate: finalEventDate,
    artistId: booking.artist_id,
    artistName: booking.artist?.stage_name ?? null,
    staffIds: input.staff_ids,
  })

  if (conflicts.length > 0 && !input.override_overlap) {
    return NextResponse.json(
      { error: 'Mogelijke dubbelboeking, controleer en bevestig om door te gaan.', conflicts },
      { status: 409 }
    )
  }

  // Maak Google event (best effort) van de definitieve booking-waarden.
  let googleEventId: string | null = null
  let googleError: string | undefined
  const summary = calendarTitle({
    source: booking.source,
    clientName: booking.client_name,
    artistName: booking.artist?.stage_name ?? null,
  })
  if (finalEventStart && finalEventEnd) {
    // Getimed event.
    const created = await createEvent({
      summary,
      description: finalNotes ?? undefined,
      location: finalEventLocation ?? undefined,
      startISO: finalEventStart,
      endISO: finalEventEnd,
    })
    if (created.ok && created.id) {
      googleEventId = created.id
    } else {
      googleError = created.error
    }
  } else if (finalEventDate) {
    // Hele-dag-event.
    const created = await createEvent({
      summary,
      description: finalNotes ?? undefined,
      location: finalEventLocation ?? undefined,
      allDayDate: finalEventDate,
    })
    if (created.ok && created.id) {
      googleEventId = created.id
    } else {
      googleError = created.error
    }
  } else {
    googleError = 'Geen event_start/event_end of event_date op de booking; agenda overgeslagen.'
  }

  // Update booking — inclusief eventueel aangepaste details.
  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update({
      status: 'accepted',
      decided_at: new Date().toISOString(),
      decided_by: admin.id,
      google_event_id: googleEventId,
      event_date: finalEventDate,
      event_start: finalEventStart,
      event_end: finalEventEnd,
      event_location: finalEventLocation,
      notes: finalNotes,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .maybeSingle()

  if (updateErr || !updated) {
    if (googleEventId) await deleteEvent(googleEventId)
    if (!updateErr) {
      return NextResponse.json({ error: 'De boeking is intussen al verwerkt.' }, { status: 409 })
    }
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

    // Zet de toegewezen crew als "(naam, naam)" achter de agenda-titel.
    if (googleEventId) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('full_name')
        .in('id', input.staff_ids)
      const staffNames = (profs ?? []).map((p) => p.full_name).filter((n): n is string => !!n)
      if (staffNames.length > 0) {
        await patchEvent(googleEventId, {
          summary: calendarTitle({
            source: booking.source,
            clientName: booking.client_name,
            artistName: booking.artist?.stage_name ?? null,
            staffNames,
          }),
        })
      }
    }
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
          eventDate: finalEventDate ?? 'n.t.b.',
          eventLocation: finalEventLocation ?? 'n.t.b.',
          feeFormatted: formatEUR(booking.fee_cents),
          notes: finalNotes ?? undefined,
          portalUrl: `${SITE_URL}/portal/artiest`,
        })
      )
      await sendResend({
        to: artistProfile.email,
        subject: `Klus geaccepteerd · ${finalEventDate ?? ''}`,
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
