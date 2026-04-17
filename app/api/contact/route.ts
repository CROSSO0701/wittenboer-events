import { NextResponse } from 'next/server'

const BUCKET = new Map<string, { count: number; resetAt: number }>()
const LIMIT = 5
const WINDOW_MS = 60_000

function rateLimit(ip: string) {
  const now = Date.now()
  const rec = BUCKET.get(ip)
  if (!rec || rec.resetAt < now) {
    BUCKET.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (rec.count >= LIMIT) return false
  rec.count += 1
  return true
}

type Payload = {
  name?: unknown
  email?: unknown
  phone?: unknown
  message?: unknown
}

function validate(body: Payload) {
  const fieldErrors: Record<string, string> = {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

  if (name.length < 2) fieldErrors.name = 'Vul je naam in (minimaal 2 tekens).'
  if (name.length > 120) fieldErrors.name = 'Naam is te lang.'

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRx.test(email)) fieldErrors.email = 'Vul een geldig e-mailadres in.'

  if (message.length < 10) fieldErrors.message = 'Vertel iets meer over je evenement (minimaal 10 tekens).'
  if (message.length > 4000) fieldErrors.message = 'Bericht is te lang.'

  return { fieldErrors, clean: { name, email, phone, message } }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' },
      { status: 429 },
    )
  }

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'Ongeldige verzoekdata.' }, { status: 400 })
  }

  const { fieldErrors, clean } = validate(body)
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: 'Controleer de velden.', fieldErrors }, { status: 400 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Wittenboer Events <website@wittenboerevents.nl>',
          to: ['info@wittenboerevents.nl'],
          reply_to: clean.email,
          subject: `Nieuw bericht via website — ${clean.name}`,
          text: [
            `Naam: ${clean.name}`,
            `E-mail: ${clean.email}`,
            `Telefoon: ${clean.phone || '—'}`,
            '',
            clean.message,
          ].join('\n'),
        }),
      })
      if (!resp.ok) {
        return NextResponse.json(
          { error: 'Mail kon niet worden verzonden. Bel of mail direct.' },
          { status: 502 },
        )
      }
      return NextResponse.json({ ok: true }, { status: 200 })
    } catch {
      return NextResponse.json(
        { error: 'Mail kon niet worden verzonden. Bel of mail direct.' },
        { status: 502 },
      )
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[contact] submission (no RESEND_API_KEY):', clean)
  }
  return NextResponse.json({ ok: true, dev: true }, { status: 202 })
}
