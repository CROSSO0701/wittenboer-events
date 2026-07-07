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

  // Naam + evenement samen in de titel, net als bij de publieke aanmelding en de
  // Artwin-gigs ("Evenement (Artiest)"), zodat de weergave overal consistent
  // blijft. De artiestennaam komt uit de login (het roster), niet uit een veld.
  const title = `${input.event} (${artistRow.stage_name})`

  // De bookings-tabel heeft geen aparte kolommen voor prikken/opbouwen, begane
  // grond/verdieping en verhard pad. Net als de publieke route vatten we deze
  // extra info samen in een leesbaar blok bovenaan de notes, zodat Marnix alles
  // op één plek ziet.
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
      artist_id: artistRow.id,
      created_by: user.id,
      client_name: title,
      client_phone: input.client_phone,
      event_date: input.event_date,
      event_start: input.event_start,
      event_end: input.event_end,
      event_location: input.event_location,
      notes: combinedNotes || null,
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

  // Mail naar admin (best-effort). Showtijden net als publiek als "begin - eind".
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
        email: user.email ?? 'niet opgegeven',
        phone: input.client_phone,
        artistName: artistRow.stage_name,
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
      subject: `Nieuwe klus aangemeld door ${artistRow.stage_name}`,
      html: mail.html,
      text: mail.text,
    })
  } catch {
    // mail faalt? booking staat al in de DB — niet kritisch
  }

  return NextResponse.json({ ok: true, booking: created })
}
