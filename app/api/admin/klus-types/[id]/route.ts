import { NextResponse } from 'next/server'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'

// DELETE — hard delete. Bestaande klussen houden hun kind-tekst (kolom is TEXT),
// dus weghalen van een type breekt geen historie.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await params
  const supabase = createSupabaseAdminClient()

  const { data: existing } = await supabase
    .from('klus_types')
    .select('id, label')
    .eq('id', id)
    .maybeSingle()

  const { error: delErr } = await supabase.from('klus_types').delete().eq('id', id)
  if (delErr) {
    return NextResponse.json({ error: 'Verwijderen faalde.', detail: delErr.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'klustype.deleted',
    entity: 'klus_type',
    entityId: id,
    metadata: existing?.label ? { label: existing.label } : undefined,
  })

  return NextResponse.json({ ok: true })
}
