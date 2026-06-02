import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { fetchFeed } from '../../../lib/integrations/artwinlive'
import { patchEvent, cleanArtwinSummary, calendarTitle } from '../../../lib/integrations/google-calendar'

// "Evenement (Artiest Oud)" -> "Evenement (Artiest)": de "Oud"-suffix die
// Artwin's dubbele profielen toevoegen weghalen, zodat dezelfde gig matcht.
const baseName = (n: string | null) => (n ?? '').replace(/\s*Oud\)\s*$/, ')').trim()

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET niet geconfigureerd.' }, { status: 503 })
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 401 })
  }

  // ?retitle=1 → werk ook bestaande Google-events bij naar de schone titel (eenmalig).
  const retitle = new URL(request.url).searchParams.get('retitle') === '1'

  const feed = await fetchFeed()
  if (!feed.ok) {
    return NextResponse.json({ ok: false, error: feed.error, synced: 0 }, { status: 502 })
  }

  let supabase
  try {
    supabase = createSupabaseAdminClient()
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Supabase niet beschikbaar', synced: 0 },
      { status: 503 }
    )
  }

  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  // De ArtwinLive-feed bevat ook ~1 jaar historie; alleen vandaag + toekomst
  // importeren — verleden gigs zijn niet relevant voor agenda/beschikbaarheid.
  const todayStr = new Date().toISOString().slice(0, 10)

  for (const ev of feed.events) {
    const eventDate = ev.startISO.slice(0, 10)
    if (eventDate < todayStr) {
      skipped += 1
      continue
    }
    // iCal-aggregatie-pseudo-events ("1 more booking in the night") zijn geen
    // echte gigs maar artefacten uit de feed — overslaan.
    if (/more bookings?\s+in the night/i.test(ev.summary ?? '')) {
      skipped += 1
      continue
    }
    const cleanName = cleanArtwinSummary(ev.summary)
    // Artwin heeft sommige acts dubbel in de agenda (een oude + nieuwe
    // profielnaam "… Oud"); die "Oud"-variant is steeds een duplicaat van
    // dezelfde gig — niet importeren.
    if (/\sOud\)\s*$/.test(cleanName)) {
      skipped += 1
      continue
    }
    const { data: existing } = await supabase
      .from('bookings')
      .select('id, google_event_id')
      .eq('artwinlive_id', ev.uid)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('bookings')
        .update({
          event_date: eventDate,
          event_start: ev.startISO,
          event_end: ev.endISO,
          event_location: ev.location ?? null,
          notes: ev.description ?? null,
          client_name: cleanName,
        })
        .eq('id', existing.id)
      if (error) errors.push(`update ${ev.uid}: ${error.message}`)
      else updated += 1
      // Eenmalige opschoning van bestaande agenda-titels (?retitle=1).
      if (retitle && existing.google_event_id) {
        await patchEvent(existing.google_event_id, {
          summary: calendarTitle({ source: 'artwinlive', clientName: cleanName }),
        })
      }
    } else {
      // Inhoud-ontdubbeling: staat er al een Artwin-gig op deze datum met
      // dezelfde (genormaliseerde) naam? Dan is dit een dubbele feed-entry —
      // Artwin levert dezelfde gig soms met net andere tijd/locatie — overslaan.
      const base = baseName(cleanName)
      const { data: sameDay } = await supabase
        .from('bookings')
        .select('client_name')
        .eq('source', 'artwinlive')
        .eq('event_date', eventDate)
      if ((sameDay ?? []).some((r) => baseName(r.client_name) === base)) {
        skipped += 1
        continue
      }
      // Nieuwe Artwin-gig komt binnen als 'pending' ("inkomend"): NIET meer
      // automatisch op de agenda. Marnix beoordeelt/past aan en accepteert 'm,
      // pas dán wordt het Google-event aangemaakt (zie de accept-flow).
      const { error } = await supabase
        .from('bookings')
        .insert({
          source: 'artwinlive',
          artwinlive_id: ev.uid,
          status: 'pending',
          event_date: eventDate,
          event_start: ev.startISO,
          event_end: ev.endISO,
          event_location: ev.location ?? null,
          notes: ev.description ?? null,
          client_name: cleanName,
        })
      if (error) {
        errors.push(`insert ${ev.uid}: ${error.message}`)
        continue
      }
      inserted += 1
    }
  }

  return NextResponse.json({
    ok: true,
    total: feed.events.length,
    inserted,
    updated,
    skipped,
    errors,
  })
}
