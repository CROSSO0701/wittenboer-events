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
 * Publieke artiest-aanmelding: geen login, geen roster. Een artiest typt zelf
 * z'n naam en geeft een optreden door; het wordt een pending booking
 * (source='artist') die Marnix in "Te doen" beoordeelt. Beveiliging: rate-limit
 * per IP + honeypot. Niks wordt zichtbaar tot Marnix goedkeurt.
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

  // Geen roster: de artiest typte zelf z'n naam. Naam + evenement samen in de
  // titel, net als de Artwin-gigs ("Evenement (Artiest)") zodat de weergave
  // overal consistent blijft.
  const title = `${input.event} (${input.artist_name})`

  const { data: created, error: insertErr } = await supabase
    .from('bookings')
    .insert({
      source: 'artist',
      artist_id: null,
      created_by: null,
      client_name: title,
      client_phone: input.client_phone ?? null,
      event_date: input.event_date,
      event_start: input.event_start ?? null,
      event_end: input.event_end ?? null,
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

  // Audit-log (best-effort). Geen actor: publieke link zonder login. We schrijven
  // rechtstreeks naar audit_log met een eigen action-string, omdat dit een
  // publieke aanmelding is en geen admin-actie uit de AuditAction-union.
  try {
    await supabase.from('audit_log').insert({
      actor_id: null,
      action: 'booking.public_submitted',
      entity: 'booking',
      entity_id: created.id,
      metadata: {
        source: 'public-klus-doorgeven',
        artist_name: input.artist_name,
        event: input.event,
        event_date: input.event_date,
      } as never,
    })
  } catch {
    // Audit-write mag de aanmelding nooit blokkeren.
  }

  // Notificatie naar Marnix (best-effort).
  try {
    const mail = await renderEmail(
      InquiryReceivedMail({
        type: 'artist-booking',
        name: input.event,
        email: 'niet opgegeven',
        phone: input.client_phone,
        artistName: input.artist_name,
        eventDate: input.event_date,
        location: input.event_location,
        message: input.notes,
      })
    )
    await sendResend({
      to: ADMIN_EMAIL,
      subject: `Nieuwe klus aangemeld door ${input.artist_name}`,
      html: mail.html,
      text: mail.text,
    })
  } catch {
    // mail faalt? booking staat al in de DB — niet kritisch
  }

  return NextResponse.json({ ok: true })
}
