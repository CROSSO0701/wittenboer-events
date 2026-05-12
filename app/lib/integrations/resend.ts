// Resend via fetch — geen SDK. Faalt netjes zonder API_KEY.

type SendArgs = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

// Configurable via env. Moet een door Resend-geverifieerd domein zijn.
// Voorbeeld: 'Wittenboer Events <noreply@jouw-andere-site.nl>'
const FROM_DEFAULT =
  process.env.RESEND_FROM_EMAIL || 'Wittenboer Events <noreply@wittenboerevents.nl>'

// Optionele reply-to override (bv. naar info@wittenboerevents.nl zodat antwoorden
// daar terechtkomen ook al verstuurt Resend vanuit een ander domein).
const REPLY_TO_DEFAULT = process.env.RESEND_REPLY_TO || undefined

export async function sendResend(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[resend:dev] would send:', { to: args.to, subject: args.subject })
    }
    return { ok: false, error: 'RESEND_API_KEY ontbreekt' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: args.from ?? FROM_DEFAULT,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.replyTo ?? REPLY_TO_DEFAULT,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${body}` }
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
