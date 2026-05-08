import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { upsertCredential, getCredential } from '../../../../lib/integrations/credentials'
import { logAudit } from '../../../../lib/audit'
import { parseIcal } from '../../../../lib/integrations/artwinlive'

const schema = z.object({
  ical_url: z
    .string()
    .trim()
    .url('Ongeldige URL')
    .max(1024)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export async function POST(request: Request) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige invoer.', issues: parsed.error.issues }, { status: 400 })
  }

  const existing = await getCredential('artwinlive')
  const newExtra = {
    ...((existing?.extra as Record<string, unknown> | null) ?? {}),
    ical_url: parsed.data.ical_url ?? null,
  }
  const saved = await upsertCredential({
    provider: 'artwinlive',
    extra: newExtra,
    updated_by: admin.id,
  })
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error ?? 'Opslaan faalde' }, { status: 500 })
  }
  await logAudit({
    actorId: admin.id,
    action: 'integration.artwinlive_saved',
    entity: 'integration',
    metadata: { has_url: !!parsed.data.ical_url },
  })
  return NextResponse.json({ ok: true })
}

// GET — test current iCal feed by fetching it and parsing
export async function GET() {
  try {
    await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }
  const cred = await getCredential('artwinlive')
  const url = ((cred?.extra as { ical_url?: string } | null)?.ical_url) ?? process.env.ARTWINLIVE_ICAL_URL
  if (!url) return NextResponse.json({ ok: false, error: 'Geen iCal-URL geconfigureerd.' }, { status: 400 })
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ ok: false, error: `Feed gaf status ${res.status}` })
    const text = await res.text()
    const events = parseIcal(text)
    return NextResponse.json({ ok: true, count: events.length, sample: events.slice(0, 3) })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
