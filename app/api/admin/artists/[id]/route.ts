import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { logAudit } from '../../../../lib/audit'
import { slugFor } from '../../../../lib/schemas/invite'
import type { Database } from '../../../../lib/db/types.generated'

type ArtistUpdate = Database['public']['Tables']['artists']['Update']

const patchSchema = z.object({
  stage_name: z.string().trim().min(2).max(80).optional(),
  genre: z.string().trim().max(80).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  photo_url: z.string().url().nullable().optional().or(z.literal('')),
  external_booking_url: z.string().url().nullable().optional().or(z.literal('')),
  active: z.boolean().optional(),
  display_order: z.number().int().min(0).max(9999).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

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
    return NextResponse.json({ error: 'Ongeldige artiest-ID.' }, { status: 400 })
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

  const updates: ArtistUpdate = {}
  const d = parsed.data
  if (d.stage_name !== undefined) updates.stage_name = d.stage_name
  if (d.genre !== undefined) updates.genre = d.genre === '' ? null : d.genre
  if (d.bio !== undefined) updates.bio = d.bio === '' ? null : d.bio
  if (d.photo_url !== undefined) updates.photo_url = d.photo_url === '' ? null : d.photo_url
  if (d.external_booking_url !== undefined)
    updates.external_booking_url = d.external_booking_url === '' ? null : d.external_booking_url
  if (d.active !== undefined) updates.active = d.active
  if (d.display_order !== undefined) updates.display_order = d.display_order

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Niets om bij te werken.' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  // Bij naamwijziging: genereer een unieke slug
  if (typeof updates.stage_name === 'string') {
    const base = slugFor(updates.stage_name)
    let slug = base
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await supabase
        .from('artists')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle()
      if (!clash) break
      slug = `${base}-${i}`
    }
    updates.slug = slug
  }

  const { data, error } = await supabase
    .from('artists')
    .update(updates)
    .eq('id', id)
    .select('id, stage_name, slug, active, profile_id')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Bijwerken faalde.', detail: error?.message }, { status: 500 })
  }

  await logAudit({
    actorId: admin.id,
    action: 'artist.updated',
    entity: 'artist',
    entityId: id,
    metadata: { fields: Object.keys(updates) },
  })

  return NextResponse.json({ ok: true, artist: data })
}

export async function DELETE(_request: Request, context: RouteContext) {
  let admin
  try {
    admin = await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Ongeldige artiest-ID.' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  // Check op bookings — voorkomen we per ongeluk historie kwijtraken.
  const { count: bookingCount, error: countErr } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('artist_id', id)

  if (countErr) {
    return NextResponse.json({ error: 'Controle faalde.', detail: countErr.message }, { status: 500 })
  }

  if ((bookingCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Deze artiest heeft ${bookingCount} aanvragen/klussen in de historie. Verwijderen niet mogelijk, gebruik 'Niet meer tonen' (actief uit).`,
      },
      { status: 409 }
    )
  }

  // Haal info op voor audit-log voordat we deleten
  const { data: artist } = await supabase
    .from('artists')
    .select('stage_name, profile_id')
    .eq('id', id)
    .maybeSingle()

  if (!artist) {
    return NextResponse.json({ error: 'Artiest niet gevonden.' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase.from('artists').delete().eq('id', id)
  if (deleteErr) {
    return NextResponse.json({ error: 'Verwijderen faalde.', detail: deleteErr.message }, { status: 500 })
  }

  // Als er een gekoppelde user was: maak profile-rol weer 'artist'-loos.
  // (Optioneel — laat de user-account staan zodat ze niet plots geen toegang meer hebben
  // tot eventuele andere onderdelen. Admin kan het account later opruimen via Supabase dashboard.)

  await logAudit({
    actorId: admin.id,
    action: 'artist.deleted',
    entity: 'artist',
    entityId: id,
    metadata: { stage_name: artist.stage_name, had_user: !!artist.profile_id },
  })

  return NextResponse.json({ ok: true })
}
