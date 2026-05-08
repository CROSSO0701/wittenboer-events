import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { cancelBookingSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { deleteEvent } from '../../../../lib/integrations/google-calendar'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { BookingCancelledMail } from '../../../../lib/email/templates/booking-cancelled'
import { logAudit } from '../../../../lib/audit'

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
    input = cancelBookingSchema.parse(body)
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
  if (fetchErr || !booking) {
    return NextResponse.json({ error: 'Boeking niet gevonden.' }, { status: 404 })
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Boeking is al geannuleerd.' }, { status: 409 })
  }

  // Verwijder Google event indien aanwezig
  let googleResult: { ok: boolean; error?: string } = { ok: true }
  if (booking.google_event_id) {
    googleResult = await deleteEvent(booking.google_event_id)
  }

  const { data: updated, error: updErr } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      decline_reason: input.reason ?? booking.decline_reason,
      decided_at: new Date().toISOString(),
      decided_by: admin.id,
      google_event_id: googleResult.ok ? null : booking.google_event_id,
    })
    .eq('id', id)
    .select()
    .maybeSingle()
  if (updErr || !updated) {
    return NextResponse.json({ error: 'Annuleren faalde.', detail: updErr?.message }, { status: 500 })
  }

  // Mail naar artiest (eigen mail-template) + klant
  const recipients: Array<{ to: string; name: string }> = []
  if (booking.artist?.profile_id) {
    const { data: artistProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.artist.profile_id)
      .maybeSingle()
    if (artistProfile?.email) {
      recipients.push({
        to: artistProfile.email,
        name: artistProfile.full_name || booking.artist.stage_name || 'collega',
      })
    }
  }
  if (booking.client_email) {
    recipients.push({ to: booking.client_email, name: booking.client_name ?? 'klant' })
  }

  for (const r of recipients) {
    const html = await renderEmail(
      BookingCancelledMail({
        name: r.name,
        clientName: booking.client_name ?? '(geen naam)',
        eventDate: booking.event_date ?? 'n.t.b.',
        eventLocation: booking.event_location ?? 'n.t.b.',
        reason: input.reason,
      })
    )
    await sendResend({
      to: r.to,
      subject: `Klus geannuleerd · ${booking.event_date ?? ''}`,
      html: html.html,
      text: html.text,
    })
  }

  await logAudit({
    actorId: admin.id,
    action: 'booking.cancelled',
    entity: 'booking',
    entityId: id,
    metadata: { reason: input.reason ?? null, googleDeleted: googleResult.ok && !!booking.google_event_id },
  })

  return NextResponse.json({
    ok: true,
    booking: updated,
    googleDeleted: googleResult.ok && !!booking.google_event_id,
    googleError: googleResult.error,
  })
}
