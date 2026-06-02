import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '../../../lib/db/server'
import type { Database } from '../../../lib/db/types.generated'
import { fmtAgo } from '../../../lib/format'
import {
  AdminDashboard,
  type ActivityItem,
  type Stats,
} from './_components/AdminDashboard'
import type { TodayInitial } from './_components/TodayWidget'
import type { FeedInitial, FeedItem } from './_components/WachtOpJou'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type DB = SupabaseClient<Database>

/** Lokale datum (YYYY-MM-DD) — gelijk aan TodayWidget, NIET toISOString (UTC). */
function ymd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Best-effort server-voorlading van de dashboard-data. Faalt stil naar
 * undefined per blok: lukt een query niet (RLS, cookies, leeg), dan blijft die
 * prop weg en valt het bijbehorende component terug op zijn client-fetch.
 * Géén worp naar buiten — een trage/falende preload mag de pagina nooit breken.
 */
async function preload(supabase: DB): Promise<{
  stats?: Stats
  activity?: ActivityItem[]
  today?: TodayInitial
  feed?: FeedInitial
}> {
  const todayIso = ymd(new Date())

  // Spiegelt exact de vier client-fetches; alles parallel.
  const [statsRes, activityRes, todayRes, nextRes, feedRes] = await Promise.allSettled([
    // (a) dashboard_stats RPC
    supabase.rpc('dashboard_stats'),
    // (b) recente activiteit
    supabase
      .from('bookings')
      .select('id, status, client_name, decided_at, updated_at, source, artist:artists(stage_name)')
      .order('updated_at', { ascending: false })
      .limit(8),
    // (c) vandaag-data voor TodayWidget
    supabase
      .from('bookings')
      .select(
        '*, artist:artists(stage_name), assignments:booking_assignments(staff_id, profile:profiles(full_name))'
      )
      .eq('status', 'accepted')
      .eq('event_date', todayIso)
      .order('event_start', { ascending: true, nullsFirst: false }),
    // (c') eerstvolgende klus (alleen relevant als vandaag leeg is)
    supabase
      .from('bookings')
      .select('event_date, client_name')
      .eq('status', 'accepted')
      .gt('event_date', todayIso)
      .order('event_date', { ascending: true })
      .limit(1),
    // (d) WachtOpJou-feed: pending bookings + 3 inquiry-tabellen met status 'new'
    Promise.all([
      supabase
        .from('bookings')
        .select(
          'id, source, status, client_id, client_name, client_email, client_phone, ' +
            'event_date, event_start, event_end, event_location, fee_cents, notes, ' +
            'decline_reason, created_at, artist:artists(stage_name)'
        )
        .eq('status', 'pending')
        .neq('source', 'artwinlive')
        .order('event_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('contact_inquiries')
        .select('id, name, email, subject, status, created_at')
        .eq('status', 'new')
        .order('created_at', { ascending: false }),
      supabase
        .from('disco_inquiries')
        .select('id, name, email, event_date, location, status, created_at, package:disco_packages(name)')
        .eq('status', 'new')
        .order('created_at', { ascending: false }),
      supabase
        .from('artist_booking_inquiries')
        .select('id, name, email, event_date, event_location, status, created_at, artist:artists(stage_name)')
        .eq('status', 'new')
        .order('created_at', { ascending: false }),
    ]),
  ])

  // ── (a) stats ──────────────────────────────────────────────────────────
  let stats: Stats | undefined
  if (statsRes.status === 'fulfilled' && !statsRes.value.error) {
    const rows = statsRes.value.data
    const r = rows?.[0]
    if (r) {
      stats = {
        pending: r.open ?? 0,
        thisWeek: r.this_week ?? 0,
        thisWeekDelta: r.last_week == null ? null : (r.this_week ?? 0) - r.last_week,
        weekend: r.weekend ?? 0,
        staffPlanned: r.staff_planned ?? 0,
      }
    }
  }

  // ── (b) recente activiteit ─────────────────────────────────────────────
  let activity: ActivityItem[] | undefined
  if (activityRes.status === 'fulfilled' && !activityRes.value.error) {
    const recent = activityRes.value.data ?? []
    activity = recent.map((r) => {
      const who = r.client_name ?? r.artist?.stage_name ?? 'onbekend'
      const text =
        r.status === 'accepted' && r.decided_at
          ? `Geaccepteerd · ${who}`
          : r.status === 'declined' && r.decided_at
            ? `Afgewezen · ${who}`
            : r.source === 'artwinlive'
              ? `Artwin-import · ${who}`
              : `Aangevraagd · ${who}`
      return { id: r.id, text, when: fmtAgo(r.updated_at) }
    })
  }

  // ── (c) vandaag + eerstvolgende ────────────────────────────────────────
  let today: TodayInitial | undefined
  if (todayRes.status === 'fulfilled' && !todayRes.value.error) {
    // Cast via unknown: de geneste embed (assignments→profiles) laat PostgREST's
    // type-inference naar een error-union vallen; todayRes.value.error is hierboven
    // al afgevangen, dus de vorm is run-time gelijk aan de client-fetch.
    const todayRows = (todayRes.value.data ?? []) as unknown as TodayInitial['today']
    let next: TodayInitial['next'] = null
    if (
      todayRows.length === 0 &&
      nextRes.status === 'fulfilled' &&
      !nextRes.value.error
    ) {
      const r = nextRes.value.data?.[0]
      if (r?.event_date) next = { date: r.event_date, client_name: r.client_name }
    }
    today = { today: todayRows, next }
  }

  // ── (d) WachtOpJou-feed ────────────────────────────────────────────────
  let feed: FeedInitial | undefined
  if (feedRes.status === 'fulfilled') {
    const [b, c, d, a] = feedRes.value
    if (!b.error && !c.error && !d.error && !a.error) {
      feed = buildFeed(b.data, c.data, d.data, a.data)
    }
  }

  return { stats, activity, today, feed }
}

// ── Feed-mapping: identiek aan WachtOpJou.load() ──────────────────────────
const CONTACT_STATUSES = ['new', 'replied', 'closed'] as const
const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'closed'] as const

type BookingFeedRow = Database['public']['Tables']['bookings']['Row'] & {
  artist?: { stage_name: string | null } | null
}
type ContactRow = Pick<
  Database['public']['Tables']['contact_inquiries']['Row'],
  'id' | 'name' | 'email' | 'subject' | 'status' | 'created_at'
>
type DiscoRow = Pick<
  Database['public']['Tables']['disco_inquiries']['Row'],
  'id' | 'name' | 'email' | 'event_date' | 'location' | 'status' | 'created_at'
> & { package?: { name: string } | null }
type ArtistRow = Pick<
  Database['public']['Tables']['artist_booking_inquiries']['Row'],
  'id' | 'name' | 'email' | 'event_date' | 'event_location' | 'status' | 'created_at'
> & { artist?: { stage_name: string } | null }

function buildFeed(
  bookings: unknown,
  contacts: unknown,
  discos: unknown,
  artists: unknown
): FeedItem[] {
  const items: FeedItem[] = []

  for (const row of (bookings as BookingFeedRow[]) ?? []) {
    items.push({
      key: `booking:${row.id}`,
      iconKind: row.source === 'artist' ? 'artist' : 'client',
      kind: 'booking',
      name: row.client_name ?? '(geen klantnaam)',
      email: row.client_email,
      date: row.event_date,
      location: row.event_location,
      need: row.artist?.stage_name ? `Artiest · ${row.artist.stage_name}` : 'Boeking',
      createdAt: row.created_at,
      status: row.status,
      booking: row,
    })
  }

  for (const row of (contacts as ContactRow[]) ?? []) {
    items.push({
      key: `contact:${row.id}`,
      iconKind: 'request',
      kind: 'inquiry',
      name: row.name,
      email: row.email,
      date: null,
      location: null,
      need: row.subject ?? 'Contactvraag',
      createdAt: row.created_at,
      status: row.status,
      inquiryType: 'contact',
      statusOptions: CONTACT_STATUSES,
    })
  }

  for (const row of (discos as DiscoRow[]) ?? []) {
    items.push({
      key: `disco:${row.id}`,
      iconKind: 'request',
      kind: 'inquiry',
      name: row.name,
      email: row.email,
      date: row.event_date,
      location: row.location,
      need: row.package?.name ? `Pakket · ${row.package.name}` : 'Show-pakket',
      createdAt: row.created_at,
      status: row.status,
      inquiryType: 'show-package',
      statusOptions: INQUIRY_STATUSES,
    })
  }

  for (const row of (artists as ArtistRow[]) ?? []) {
    items.push({
      key: `artist-inquiry:${row.id}`,
      iconKind: 'artist',
      kind: 'inquiry',
      name: row.name,
      email: row.email,
      date: row.event_date,
      location: row.event_location,
      need: row.artist?.stage_name ? `Artiest · ${row.artist.stage_name}` : 'Artiest-aanvraag',
      createdAt: row.created_at,
      status: row.status,
      inquiryType: 'artist-booking',
      statusOptions: INQUIRY_STATUSES,
    })
  }

  items.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
  return items
}

export default async function AdminPage() {
  let supabase: DB
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-fg-muted)]">
        Geen beheerdersrechten. Neem contact op met de beheerder om je rol aan te passen.
      </div>
    )
  }

  // Best-effort voorlading; faalt stil → componenten halen zelf op (vangnet).
  let initial: Awaited<ReturnType<typeof preload>> = {}
  try {
    initial = await preload(supabase)
  } catch {
    // Niets doen — dashboard valt terug op client-fetch.
  }

  return (
    <AdminDashboard
      initialStats={initial.stats}
      initialActivity={initial.activity}
      initialToday={initial.today}
      initialFeed={initial.feed}
    />
  )
}
