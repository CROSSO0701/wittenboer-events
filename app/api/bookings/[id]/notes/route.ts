import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireUser } from '../../../../lib/auth/helpers'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'

const noteSchema = z.object({
  body: z.string().trim().min(1, 'Bericht mag niet leeg zijn').max(2000),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user
  try {
    user = await requireUser()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('booking_notes')
    .select('id, body, created_at, author_id, author:profiles(full_name, role)')
    .eq('booking_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Database-fout.', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, notes: data ?? [], me: user.id })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user
  try {
    user = await requireUser()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }
  const parsed = noteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige invoer.', issues: parsed.error.issues }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('booking_notes')
    .insert({ booking_id: id, author_id: user.id, body: parsed.data.body })
    .select('id, body, created_at, author_id, author:profiles(full_name, role)')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Notitie kon niet worden opgeslagen.', detail: error?.message }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    action: 'note.added',
    entity: 'booking',
    entityId: id,
  })

  return NextResponse.json({ ok: true, note: data })
}
