import 'server-only'
import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../db/types.generated'
import { sendResend } from '../integrations/resend'
import { renderEmail } from '../email/render'
import { CrewWelcomeMail } from '../email/templates/crew-welcome'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type SupabaseAdminClient = SupabaseClient<Database>

type ProvisionTarget = {
  id: string
  email: string
  full_name: string | null
}

export type ProvisionResult = {
  mailSent: boolean
  mailError?: string
  skipped?: 'no-resend'
}

// Zorgt dat het profiel een calendar_feed_token heeft: hergebruikt een bestaand
// token, of genereert er een (in Node, want de JS-client kan geen SQL-expressie
// in .update() zetten) en zet die alleen als het veld nog leeg is (guard tegen
// races). Leest daarna terug welk token uiteindelijk geldig is.
async function ensureCalendarFeedToken(
  supabase: SupabaseAdminClient,
  profileId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('calendar_feed_token')
    .eq('id', profileId)
    .maybeSingle()

  if (existing?.calendar_feed_token) {
    return existing.calendar_feed_token
  }

  const newToken = randomBytes(24).toString('hex')
  await supabase
    .from('profiles')
    .update({ calendar_feed_token: newToken })
    .eq('id', profileId)
    .is('calendar_feed_token', null)

  // Lees terug welk token nu geldig is (een parallelle call kan gewonnen hebben).
  const { data: current } = await supabase
    .from('profiles')
    .select('calendar_feed_token')
    .eq('id', profileId)
    .maybeSingle()

  return current?.calendar_feed_token ?? newToken
}

// Provisioning voor een crewlid: token aanmaken indien leeg, magic-link
// genereren, welkomstmail (inlog + persoonlijke agenda-link) versturen. Puur:
// geeft geen NextResponse terug, gooit alleen bij een echte fout in de
// magic-link-generatie.
export async function sendCrewWelcome(
  supabase: SupabaseAdminClient,
  target: ProvisionTarget
): Promise<ProvisionResult> {
  const token = await ensureCalendarFeedToken(supabase, target.id)
  const calendarUrl = `${SITE_URL}/api/calendar/${token}.ics`

  const redirectTo = `${SITE_URL}/auth/callback`
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
    options: { redirectTo },
  })
  if (linkErr || !linkData?.properties?.action_link) {
    throw new Error(linkErr?.message ?? 'Inloglink genereren faalde.')
  }
  const loginLink = linkData.properties.action_link

  if (!process.env.RESEND_API_KEY) {
    return { mailSent: false, skipped: 'no-resend' }
  }

  const mail = await renderEmail(
    CrewWelcomeMail({
      name: target.full_name ?? 'crewlid',
      loginLink,
      calendarUrl,
    })
  )
  const sent = await sendResend({
    to: target.email,
    subject: 'Welkom bij Wittenboer Events: inloggen en je agenda',
    html: mail.html,
    text: mail.text,
  })

  return { mailSent: sent.ok, mailError: sent.error }
}
