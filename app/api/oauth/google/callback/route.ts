import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { upsertCredential } from '../../../../lib/integrations/credentials'
import { logAudit } from '../../../../lib/audit'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function htmlPage(body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Google OAuth · Wittenboer</title><style>
      body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F5F5F6;color:#1E2A2F;padding:48px 16px;}
      .card{max-width:680px;margin:0 auto;background:#fff;border:1px solid #DCDEE0;border-radius:16px;padding:32px;box-shadow:0 24px 48px -32px rgba(30,42,47,.15);}
      h1{margin:0 0 8px;font-size:22px;}
      h2{margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.16em;color:#636466;}
      pre{background:#F2F2F3;border:1px solid #DCDEE0;border-radius:8px;padding:14px;overflow:auto;font-size:13px;word-break:break-all;white-space:pre-wrap;}
      .err{background:#FEE2E2;border:1px solid #FCA5A5;color:#7F1D1D;padding:12px 14px;border-radius:8px;}
      .ok{background:#E3F0F3;border:1px solid #157A8C;color:#0B4A57;padding:12px 14px;border-radius:8px;margin-bottom:20px;}
      a{color:#157A8C;}
    </style></head><body><div class="card">${body}</div></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(request: Request) {
  try {
    await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) {
      return htmlPage(
        `<h1>Geen toegang</h1><div class="err">${escapeHtml(err.message)}</div><p><a href="/portal/login">Log in als admin</a></p>`,
        err.status
      )
    }
    throw err
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return htmlPage(`<h1>OAuth geweigerd</h1><div class="err">${escapeHtml(error)}</div>`, 400)
  }

  const cookieHeader = request.headers.get('cookie') ?? ''
  const stateCookie = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('we_oauth_state='))
    ?.split('=')[1]

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return htmlPage(
      `<h1>State-validatie faalde</h1><div class="err">De OAuth-state komt niet overeen. Start opnieuw via <a href="/api/oauth/google/start">/api/oauth/google/start</a>.</div>`,
      400
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return htmlPage(
      `<h1>Configuratie ontbreekt</h1><div class="err">GOOGLE_CLIENT_ID of GOOGLE_CLIENT_SECRET niet gezet.</div>`,
      503
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin
  const redirectUri = `${siteUrl}/api/oauth/google/callback`

  let tokens: { refresh_token?: string; access_token?: string; expires_in?: number; scope?: string }
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      return htmlPage(
        `<h1>Token-exchange faalde</h1><div class="err">${escapeHtml(`${res.status}: ${errBody}`)}</div>`,
        502
      )
    }
    tokens = await res.json()
  } catch (err) {
    return htmlPage(
      `<h1>Token-exchange faalde</h1><div class="err">${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`,
      502
    )
  }

  if (!tokens.refresh_token) {
    return htmlPage(
      `<h1>Geen refresh_token ontvangen</h1>
       <div class="err">Google geeft alleen een refresh_token bij <strong>eerste</strong> consent of met <code>prompt=consent</code>. Verwijder Wittenboer Events uit je <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">Google account permissions</a> en doorloop <a href="/api/oauth/google/start">/api/oauth/google/start</a> opnieuw.</div>`,
      400
    )
  }

  // Bewaar in DB (integration_credentials). Geen handmatig env-plakken meer.
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    admin = null
  }
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
  const saved = await upsertCredential({
    provider: 'google_calendar',
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token ?? null,
    expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    extra: { calendar_id: calendarId, scope: tokens.scope ?? null },
    updated_by: admin?.id ?? null,
  })
  if (!saved.ok) {
    return htmlPage(
      `<h1>Opslaan faalde</h1><div class="err">${escapeHtml(saved.error ?? 'Onbekende fout')}</div>`,
      500
    )
  }
  await logAudit({
    actorId: admin?.id ?? null,
    action: 'integration.google_connected',
    entity: 'integration',
    metadata: { calendar_id: calendarId },
  })

  // Direct doorsturen naar integraties-pagina met success-flag.
  const target = `${siteUrl}/portal/admin/integraties?google=connected`
  const res = new Response(null, { status: 302, headers: { Location: target } })
  res.headers.append(
    'set-cookie',
    `we_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure; Domain=.wittenboerevents.nl' : ''
    }`
  )
  return res
}
