import { NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { AuthError, requireAdmin } from '../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../lib/db/server'
import { logAudit } from '../../../lib/audit'

const createKlusTypeSchema = z.object({
  label: z.string().trim().min(1, 'Geef een naam op').max(60),
})

// GET — lijst klus-types. Default: alleen active (voor de dropdown).
// ?all=1 geeft ook inactieve terug (voor de beheer-dialog).
export async function GET(request: Request) {
  try {
    await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const all = new URL(request.url).searchParams.get('all') === '1'
  const supabase = createSupabaseAdminClient()

  let query = supabase
    .from('klus_types')
    .select('id, label, sort_order, active')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })
  if (!all) query = query.eq('active', true)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Ophalen faalde.', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ types: data ?? [] })
}

// POST — nieuw klus-type.
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

  let input
  try {
    input = createKlusTypeSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Ongeldige invoer.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  // Sorteer nieuw type achteraan.
  const { data: last } = await supabase
    .from('klus_types')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextSort = (last?.sort_order ?? -1) + 1

  const { data: type, error: insertErr } = await supabase
    .from('klus_types')
    .insert({ label: input.label, sort_order: nextSort, active: true })
    .select('id, label, sort_order, active')
    .maybeSingle()

  if (insertErr || !type) {
    // 23505 = unique_violation → label bestaat al.
    if (insertErr?.code === '23505') {
      return NextResponse.json({ error: 'Dit type bestaat al.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Aanmaken faalde.', detail: insertErr?.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'klustype.created',
    entity: 'klus_type',
    entityId: type.id,
    metadata: { label: type.label },
  })

  return NextResponse.json({ ok: true, type })
}
