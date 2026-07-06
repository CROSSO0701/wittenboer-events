import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'
import type { Database } from '../../../../lib/db/types.generated'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Zelfde e-mail-normalisatie als inviteStaffSchema: trim + lowercase.
const patchSchema = z.object({
  full_name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().toLowerCase().email().max(320).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

function friendlyAuthError(msg?: string | null): string {
  if (!msg) return 'E-mail wijzigen faalde.'
  const m = msg.toLowerCase()
  if (m.includes('already') || m.includes('registered') || m.includes('exists')) {
    return 'Deze e-mail heeft al een account.'
  }
  return `E-mail wijzigen faalde: ${msg}`
}

export async function PATCH(request: Request, context: RouteContext) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Ongeldige crew-ID.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige invoer.', issues: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data

  const supabase = createSupabaseAdminClient()

  // Doelprofiel ophalen en valideren dat het echt een crewlid is.
  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', id)
    .maybeSingle()
  if (targetErr) {
    return NextResponse.json({ error: 'Ophalen faalde.', detail: targetErr.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: 'Crewlid niet gevonden.' }, { status: 404 })
  }
  if (target.role !== 'staff') {
    return NextResponse.json({ error: 'Dit account is geen crewlid.' }, { status: 403 })
  }

  // E-mailwijziging: enkel doorvoeren als het adres echt verandert (case-insensitief).
  const emailChanged =
    d.email !== undefined && d.email !== (target.email ?? '').trim().toLowerCase()

  if (emailChanged) {
    // Voorkom drift: check of een ander contact dit adres al gebruikt.
    const { data: clash, error: clashErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', d.email as string)
      .neq('id', id)
      .maybeSingle()
    if (clashErr) {
      return NextResponse.json({ error: 'Controle faalde.', detail: clashErr.message }, { status: 500 })
    }
    if (clash) {
      return NextResponse.json(
        { error: 'Deze e-mail is al in gebruik door een ander contact.' },
        { status: 409 }
      )
    }

    // Het interne auth.users-record moet meeveranderen, anders matcht de
    // invite-route (die op profiles.email matcht) straks niet meer.
    const { error: authErr } = await supabase.auth.admin.updateUserById(id, {
      email: d.email as string,
      email_confirm: true,
    })
    if (authErr) {
      return NextResponse.json(
        { error: friendlyAuthError(authErr.message), detail: authErr.message },
        { status: 400 }
      )
    }
  }

  // profiles-update opbouwen met alleen de meegegeven velden.
  const updates: ProfileUpdate = {}
  if (d.full_name !== undefined) updates.full_name = d.full_name
  if (d.phone !== undefined) updates.phone = d.phone === '' ? null : d.phone
  if (d.email !== undefined) updates.email = d.email

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Niets om bij te werken.' }, { status: 400 })
  }

  const { data: updated, error: updateErr } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (updateErr || !updated) {
    return NextResponse.json(
      { error: 'Profiel bijwerken faalde.', detail: updateErr?.message },
      { status: 500 }
    )
  }

  await logAudit({
    actorId: admin.id,
    action: 'staff.updated',
    entity: 'profile',
    entityId: id,
    metadata: { fields: Object.keys(updates) },
  })

  return NextResponse.json({ ok: true })
}
