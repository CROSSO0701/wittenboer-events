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

  // De bookings-tabel heeft geen aparte kolommen voor prikken/opbouwen,
  // begane grond/verdieping en verhard pad. We vatten deze extra info samen in
  // een leesbaar blok bovenaan de notes, zodat Marnix alles op één plek ziet.
  const setupLabel = input.setup_type === 'prikken' ? 'Prikken' : 'Opbouwen'
  const floorLabel =
    input.floor_level === 'begane_grond'
      ? 'Begane grond'
      : input.floor_level === 'verdieping'
        ? 'Verdieping'
        : null
  const pavedLabel =
    input.paved_path === true ? 'Ja' : input.paved_path === false ? 'Nee' : null

  const detailLines = [
    `Prikken of opbouwen: ${setupLabel}`,
    floorLabel ? `Begane grond of verdieping: ${floorLabel}` : null,
    pavedLabel ? `Verhard pad naar het optreden: ${pavedLabel}` : null,
  ].filter((l): l is string => l !== null)

  const combinedNotes = [detailLines.join('\n'), input.notes?.trim() || null]
    .filter((part): part is string => Boolean(part))
    .join('\n\n')

  const { data: created, error: insertErr } = await supabase
    .from('bookings')
    .insert({
      source: 'artist',
      artist_id: null,
      created_by: null,
      client_name: title,
      client_phone: input.client_phone,
      event_date: input.event_date,
      event_start: input.event_start,
      event_end: input.event_end,
      event_location: input.event_location,
      notes: combinedNotes || null,
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
    const fmtTime = (iso: string) =>
      new Intl.DateTimeFormat('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam',
      }).format(new Date(iso))
    const showtimes = `${fmtTime(input.event_start)} - ${fmtTime(input.event_end)}`

    const mail = await renderEmail(
      InquiryReceivedMail({
        type: 'artist-booking',
        name: input.event,
        email: 'niet opgegeven',
        phone: input.client_phone,
        artistName: input.artist_name,
        eventDate: input.event_date,
        showtimes,
        location: input.event_location,
        setupType: setupLabel,
        floorLevel: floorLabel ?? undefined,
        pavedPath: pavedLabel ?? undefined,
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
