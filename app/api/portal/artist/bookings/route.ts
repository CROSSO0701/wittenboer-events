import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { artistSubmitBookingSchema } from '../../../../lib/schemas/booking'
import { AuthError, requireArtist } from '../../../../lib/auth/helpers'
import { createSupabaseServerClient, createSupabaseAdminClient } from '../../../../lib/db/server'
import { ipFromRequest, rateLimit } from '../../../../lib/auth/rate-limit'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { InquiryReceivedMail } from '../../../../lib/email/templates/inquiry-received'

const ADMIN_EMAIL = process.env.NOTIFY_ADMIN_EMAIL || 'info@wittenboerevents.nl'

// GET — eigen bookings via RLS
export async function GET() {
  let user
  try {
    user = await requireArtist()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artist:artists(stage_name, slug)')
    .order('event_date', { ascending: false, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: 'Database-fout.', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, bookings: data, user_id: user.id })
}

// POST — nieuwe klus indienen
export async function POST(request: Request) {
  let user
  try {
    user = await requireArtist()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const ip = ipFromRequest(request)
  const limited = rateLimit(`artist-submit:${ip}:${user.id}`, 5, 60_000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Te veel verzoeken.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  let input
  try {
    input = artistSubmitBookingSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = await createSupabaseServerClient()

  // current_artist_id() RLS-helper bepaalt welk artist_id; we vragen het apart op
  // zodat we het in de insert kunnen meegeven (RLS check valideert).
  const admin = createSupabaseAdminClient()
  const { data: artistRow, error: artistErr } = await admin
    .from('artists')
    .select('id, stage_name')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (artistErr || !artistRow) {
    return NextResponse.json({ error: 'Geen gekoppelde artiest gevonden voor dit profiel.' }, { status: 400 })
  }

  const { data: created, error: insertErr } = await supabase
    .from('bookings')
    .insert({
      source: 'artist',
      artist_id: artistRow.id,
      created_by: user.id,
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone,
      event_date: input.event_date,
      event_start: input.event_start,
      event_end: input.event_end,
      event_location: input.event_location,
      fee_cents: input.fee_cents,
      notes: input.notes,
      status: 'pending',
    })
    .select()
    .maybeSingle()

  if (insertErr || !created) {
    return NextResponse.json(
      { error: 'Boeking kon niet worden opgeslagen.', detail: insertErr?.message },
      { status: 500 }
    )
  }

  // Mail naar admin
  const mail = await renderEmail(
    InquiryReceivedMail({
      type: 'artist-booking',
      name: input.client_name,
      email: input.client_email ?? user.email ?? 'onbekend@onbekend',
      phone: input.client_phone,
      artistName: artistRow.stage_name,
      eventDate: input.event_date,
      location: input.event_location,
      message: input.notes,
    })
  )
  await sendResend({
    to: ADMIN_EMAIL,
    subject: `Nieuwe klus aangemeld door ${artistRow.stage_name}`,
    html: mail.html,
    text: mail.text,
    replyTo: input.client_email,
  })

  return NextResponse.json({ ok: true, booking: created })
}
