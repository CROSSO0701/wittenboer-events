import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { getCredential } from '../../../../lib/integrations/credentials'
import { IntegrationsBoard } from './IntegrationsBoard'
import { GoogleConnectedBanner } from './GoogleConnectedBanner'

export const metadata: Metadata = { title: 'Integraties' }
export const dynamic = 'force-dynamic'

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ google?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const googleJustConnected = sp.google === 'connected'
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin/integraties')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/portal/account')

  const [google, artwin] = await Promise.all([
    getCredential('google_calendar'),
    getCredential('artwinlive'),
  ])

  const googleConnected = !!google?.refresh_token || !!process.env.GOOGLE_REFRESH_TOKEN
  const googleCalendarId =
    ((google?.extra as { calendar_id?: string } | null)?.calendar_id) ||
    process.env.GOOGLE_CALENDAR_ID ||
    null

  const artwinUrl =
    ((artwin?.extra as { ical_url?: string } | null)?.ical_url) ||
    process.env.ARTWINLIVE_ICAL_URL ||
    null

  const resendConnected = !!process.env.RESEND_API_KEY

  return (
    <div className="space-y-6">
      {googleJustConnected && <GoogleConnectedBanner />}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          Verbindingen
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Verbind je tools
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Koppel je agenda en je gig-feed zodat je geen aanvragen mist.
        </p>
      </header>

      <IntegrationsBoard
        google={{
          connected: googleConnected,
          calendarId: googleCalendarId,
          updatedAt: google?.updated_at ?? null,
        }}
        artwin={{
          icalUrl: artwinUrl,
          updatedAt: artwin?.updated_at ?? null,
        }}
        resend={{ connected: resendConnected }}
      />
    </div>
  )
}
