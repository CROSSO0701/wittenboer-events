import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { declineBookingSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { BookingDeclinedMail } from '../../../../lib/email/templates/booking-declined'
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  let input
  try {
    input = declineBookingSchema.parse(body)
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
      { error: `Boeking heeft status "${booking.status}" en kan niet meer afgewezen worden.` },
      { status: 409 }
    )
  }

  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update({
      status: 'declined',
      decline_reason: input.reason,
      decided_at: new Date().toISOString(),
      decided_by: admin.id,
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (updateErr || !updated) {
    return NextResponse.json({ error: 'Booking-update faalde.' }, { status: 500 })
  }

  if (booking.artist?.profile_id) {
    const { data: artistProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.artist.profile_id)
      .maybeSingle()
    if (artistProfile?.email) {
      const html = await renderEmail(
        BookingDeclinedMail({
          artistName: artistProfile.full_name || booking.artist.stage_name,
          clientName: booking.client_name ?? '(geen naam)',
          eventDate: booking.event_date ?? 'n.t.b.',
          reason: input.reason,
        })
      )
      await sendResend({
        to: artistProfile.email,
        subject: `Klus afgewezen · ${booking.event_date ?? ''}`,
        html: html.html,
        text: html.text,
      })
    }
  }

  await logAudit({
    actorId: admin.id,
    action: 'booking.declined',
    entity: 'booking',
    entityId: id,
    metadata: { reason: input.reason },
  })

  return NextResponse.json({ ok: true, booking: updated })
}
