import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { artistPublicSubmitSchema } from '../../lib/schemas/artist-public'
import { ipFromRequest, rateLimit } from '../../lib/auth/rate-limit'
import { createSupabaseAdminClient } from '../../lib/db/server'
import { sendResend } from '../../lib/integrations/resend'
import { renderEmail } from '../../lib/email/render'
import { InquiryReceivedMail } from '../../lib/email/templates/inquiry-received'

const ADMIN_EMAIL = process.env.NOTIFY_ADMIN_EMAIL || 'info@wittenboerevents.nl'

/**
 * Publieke artiest-aanmelding — GEEN login. Een artiest geeft via /klus-doorgeven
 * een optreden door; het wordt een pending booking (source='artist') die Marnix
 * in "Te doen" beoordeelt. Beveiliging: rate-limit per IP, honeypot, en de
 * artiest moet een bestaande ACTIEVE artiest zijn. Niks wordt zichtbaar tot
 * Marnix goedkeurt.
 */
export async function POST(request: Request) {
  const ip = ipFromRequest(request)
  const limited = rateLimit(`artist-public:${ip}`, 6, 60_000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Te veel verzoeken. Probeer over een minuut opnieuw.' },
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
    input = artistPublicSubmitSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Niet alle velden zijn correct ingevuld.', issues: err.issues },
        { status: 400 }
      )
    }
    throw err
  }

  // Honeypot — stil 200 terug (bot)
  if (input.website && input.website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createSupabaseAdminClient()

  // Artiest moet bestaan én actief zijn.
  const { data: artist, error: artistErr } = await supabase
    .from('artists')
    .select('id, stage_name, active')
    .eq('id', input.artist_id)
    .maybeSingle()
  if (artistErr || !artist || !artist.active) {
    return NextResponse.json({ error: 'Onbekende artiest. Ververs de pagina en probeer opnieuw.' }, { status: 400 })
  }

  const { data: created, error: insertErr } = await supabase
    .from('bookings')
    .insert({
      source: 'artist',
      artist_id: artist.id,
      created_by: null,
      client_name: input.client_name,
      client_phone: input.client_phone ?? null,
      event_date: input.event_date,
      event_start: input.event_start ?? null,
      event_location: input.event_location,
      notes: input.notes ?? null,
      status: 'pending',
    })
    .select('id')
    .maybeSingle()

  if (insertErr || !created) {
    return NextResponse.json(
      { error: 'Het lukte niet om je klus op te slaan. Probeer het opnieuw.', detail: insertErr?.message },
      { status: 500 }
    )
  }

  // Notificatie naar Marnix (best-effort).
  try {
    const mail = await renderEmail(
      InquiryReceivedMail({
        type: 'artist-booking',
        name: input.client_name,
        email: 'niet opgegeven',
        phone: input.client_phone,
        artistName: artist.stage_name,
        eventDate: input.event_date,
        location: input.event_location,
        message: input.notes,
      })
    )
    await sendResend({
      to: ADMIN_EMAIL,
      subject: `Nieuwe klus aangemeld door ${artist.stage_name}`,
      html: mail.html,
      text: mail.text,
    })
  } catch {
    // mail faalt? booking staat al in de DB — niet kritisch
  }

  return NextResponse.json({ ok: true })
}
