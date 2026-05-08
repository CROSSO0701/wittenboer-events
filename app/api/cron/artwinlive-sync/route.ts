import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { fetchFeed } from '../../../lib/integrations/artwinlive'
import { createEvent } from '../../../lib/integrations/google-calendar'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET niet geconfigureerd.' }, { status: 503 })
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 401 })
  }

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
  let pushed = 0
  const errors: string[] = []

  for (const ev of feed.events) {
    const eventDate = ev.startISO.slice(0, 10)
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
        })
        .eq('id', existing.id)
      if (error) errors.push(`update ${ev.uid}: ${error.message}`)
      else updated += 1
    } else {
      const { data: created, error } = await supabase
        .from('bookings')
        .insert({
          source: 'artwinlive',
          artwinlive_id: ev.uid,
          status: 'accepted',
          event_date: eventDate,
          event_start: ev.startISO,
          event_end: ev.endISO,
          event_location: ev.location ?? null,
          notes: ev.description ?? null,
          client_name: ev.summary,
        })
        .select('id')
        .maybeSingle()
      if (error || !created) {
        errors.push(`insert ${ev.uid}: ${error?.message ?? 'no row'}`)
        continue
      }
      inserted += 1

      // Push naar Google Calendar
      const gcal = await createEvent({
        summary: `[ArtwinLive] ${ev.summary}`,
        description: ev.description,
        location: ev.location,
        startISO: ev.startISO,
        endISO: ev.endISO,
        sourceId: ev.uid,
      })
      if (gcal.ok && gcal.id) {
        await supabase.from('bookings').update({ google_event_id: gcal.id }).eq('id', created.id)
        pushed += 1
      } else if (gcal.error) {
        errors.push(`gcal ${ev.uid}: ${gcal.error}`)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    total: feed.events.length,
    inserted,
    updated,
    pushed,
    errors,
  })
}
