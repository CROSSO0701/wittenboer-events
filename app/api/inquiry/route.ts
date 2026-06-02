import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { inquirySchema, type InquiryInput } from '../../lib/schemas/inquiry'
import { ipFromRequest, rateLimit } from '../../lib/auth/rate-limit'
import { createSupabaseAdminClient } from '../../lib/db/server'
import { sendResend } from '../../lib/integrations/resend'
import { renderEmail } from '../../lib/email/render'
import { InquiryReceivedMail } from '../../lib/email/templates/inquiry-received'
import { InquiryConfirmationMail } from '../../lib/email/templates/inquiry-confirmation'

const ADMIN_EMAIL = process.env.NOTIFY_ADMIN_EMAIL || 'info@wittenboerevents.nl'

export async function POST(request: Request) {
  const ip = ipFromRequest(request)
  const limited = rateLimit(`inquiry:${ip}`, 8, 60_000)
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

  let parsed: InquiryInput
  try {
    parsed = inquirySchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Niet alle velden zijn correct ingevuld.', issues: err.issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Onbekende invoerfout.' }, { status: 400 })
  }

  // Honeypot — stil 200 terug
  if ('website' in parsed && parsed.website && parsed.website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  // Insert in juiste tabel (best effort — als Supabase niet beschikbaar is, log en ga door)
  let inserted: { ok: boolean; error?: string } = { ok: false, error: 'skipped' }
  const extra: { packageName?: string; artistName?: string } = {}
  try {
    const supabase = createSupabaseAdminClient()
    if (parsed.type === 'contact') {
      const { error } = await supabase.from('contact_inquiries').insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        subject: parsed.subject,
        message: parsed.message,
      })
      inserted = error ? { ok: false, error: error.message } : { ok: true }
    } else if (parsed.type === 'show-package') {
      let packageId: string | null = null
      if (parsed.package_slug) {
        const { data: pkg } = await supabase
          .from('disco_packages')
          .select('id, name')
          .eq('slug', parsed.package_slug)
          .maybeSingle()
        packageId = pkg?.id ?? null
        extra.packageName = pkg?.name ?? parsed.package_slug
      }
      const { error } = await supabase.from('disco_inquiries').insert({
        package_id: packageId,
        name: parsed.name,
        organisation: parsed.organisation,
        email: parsed.email,
        phone: parsed.phone,
        event_date: parsed.event_date,
        guest_count: parsed.guest_count,
        location: parsed.location,
        notes: parsed.notes,
      })
      inserted = error ? { ok: false, error: error.message } : { ok: true }
    } else {
      const { data: artist } = await supabase
        .from('artists')
        .select('id, stage_name')
        .eq('slug', parsed.artist_slug)
        .maybeSingle()
      extra.artistName = artist?.stage_name ?? parsed.artist_slug
      const { error } = await supabase.from('artist_booking_inquiries').insert({
        artist_id: artist?.id ?? null,
        name: parsed.name,
        organisation: parsed.organisation,
        email: parsed.email,
        phone: parsed.phone,
        event_date: parsed.event_date,
        event_location: parsed.event_location,
        notes: parsed.notes,
      })
      inserted = error ? { ok: false, error: error.message } : { ok: true }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[inquiry:dev] Supabase niet beschikbaar:', err instanceof Error ? err.message : err)
    }
    inserted = { ok: false, error: 'supabase-unavailable' }
  }

  // Mails — admin notificatie + klant bevestiging. Beide best-effort.
  const adminMail = await renderEmail(
    InquiryReceivedMail({
      type: parsed.type,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      organisation: 'organisation' in parsed ? parsed.organisation : undefined,
      subject: 'subject' in parsed ? parsed.subject : undefined,
      message: 'message' in parsed ? parsed.message : 'notes' in parsed ? parsed.notes : undefined,
      packageName: extra.packageName,
      artistName: extra.artistName,
      eventDate: 'event_date' in parsed ? parsed.event_date : undefined,
      guestCount: 'guest_count' in parsed ? parsed.guest_count : undefined,
      location:
        'location' in parsed
          ? parsed.location
          : 'event_location' in parsed
            ? parsed.event_location
            : undefined,
    })
  )

  const confirmMail = await renderEmail(InquiryConfirmationMail({ name: parsed.name, type: parsed.type }))

  await Promise.all([
    sendResend({
      to: ADMIN_EMAIL,
      subject:
        parsed.type === 'contact'
          ? `Contact: ${parsed.name}`
          : parsed.type === 'show-package'
            ? `Pakketaanvraag: ${parsed.name}${extra.packageName ? ` · ${extra.packageName}` : ''}`
            : `Artiestboeking: ${parsed.name}${extra.artistName ? ` · ${extra.artistName}` : ''}`,
      html: adminMail.html,
      text: adminMail.text,
      replyTo: parsed.email,
    }),
    sendResend({
      to: parsed.email,
      subject: 'Bedankt voor je bericht · Wittenboer Events',
      html: confirmMail.html,
      text: confirmMail.text,
    }),
  ])

  return NextResponse.json({ ok: true, stored: inserted.ok })
}
