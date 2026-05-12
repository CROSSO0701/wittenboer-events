import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError, requireAdmin } from '../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../lib/db/server'
import { sendResend } from '../../../../lib/integrations/resend'
import { renderEmail } from '../../../../lib/email/render'
import { InviteMail } from '../../../../lib/email/templates/invite'
import { inviteArtistSchema, slugFor } from '../../../../lib/schemas/invite'
import { logAudit } from '../../../../lib/audit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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
    input = inviteArtistSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Niet alle velden zijn correct ingevuld.', issues: err.issues }, { status: 400 })
    }
    throw err
  }

  const supabase = createSupabaseAdminClient()

  // 1. Resolve artiest-rij
  let artistId = input.artist_id ?? null
  let artistName = input.stage_name ?? null

  if (artistId) {
    const { data: existing } = await supabase
      .from('artists')
      .select('id, stage_name, profile_id')
      .eq('id', artistId)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Artiest niet gevonden.' }, { status: 404 })
    if (existing.profile_id) {
      return NextResponse.json({ error: 'Deze artiest heeft al toegang.' }, { status: 409 })
    }
    artistName = existing.stage_name
  } else if (input.stage_name) {
    // nieuwe artiest aanmaken
    const baseSlug = slugFor(input.stage_name)
    let slug = baseSlug
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await supabase.from('artists').select('id').eq('slug', slug).maybeSingle()
      if (!clash) break
      slug = `${baseSlug}-${i}`
    }
    const { data: created, error: createErr } = await supabase
      .from('artists')
      .insert({
        stage_name: input.stage_name,
        slug,
        genre: input.genre ?? null,
        photo_url: input.photo_url ?? null,
        active: true,
        display_order: 999,
      })
      .select('id, stage_name')
      .maybeSingle()
    if (createErr || !created) {
      return NextResponse.json(
        { error: 'Aanmaken faalde.', detail: createErr?.message },
        { status: 500 }
      )
    }
    artistId = created.id
    artistName = created.stage_name
  }

  // 2. Stuur invite. Als Resend geconfigureerd is: gebruik generateLink + eigen
  //    branded mail. Zonder Resend: laat Supabase de invite-mail zelf versturen
  //    via inviteUserByEmail (gebruikt template uit Auth → Email Templates).
  const redirectTo = `${SITE_URL}/portal/account?welcome=1`
  const useResend = !!process.env.RESEND_API_KEY
  let userId: string | undefined
  let actionLink: string | undefined

  try {
    if (useResend) {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: input.email,
        options: { redirectTo, data: { full_name: artistName ?? '' } },
      })
      if (linkErr || !linkData) {
        return NextResponse.json(
          { error: 'Uitnodigen faalde.', detail: linkErr?.message },
          { status: 500 }
        )
      }
      userId = linkData.user?.id
      actionLink = linkData.properties?.action_link
    } else {
      const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
        input.email,
        { redirectTo, data: { full_name: artistName ?? '' } }
      )
      if (inviteErr || !inviteData?.user) {
        return NextResponse.json(
          { error: 'Uitnodigen faalde.', detail: inviteErr?.message },
          { status: 500 }
        )
      }
      userId = inviteData.user.id
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Uitnodigen faalde.', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }

  if (!userId) {
    return NextResponse.json({ error: 'Onvolledige invite-respons.' }, { status: 500 })
  }

  // 3. Werk profile bij naar role='artist' + naam
  await supabase
    .from('profiles')
    .update({ role: 'artist', full_name: artistName ?? null })
    .eq('id', userId)

  // 4. Koppel artiest aan profile
  if (artistId) {
    await supabase.from('artists').update({ profile_id: userId }).eq('id', artistId)
  }

  // 5. Bij Resend-modus: stuur eigen branded mail
  let sent: { ok: boolean; error?: string } = { ok: true }
  if (useResend && actionLink) {
    const mail = await renderEmail(
      InviteMail({
        name: artistName ?? 'artiest',
        role: 'artiest',
        link: actionLink,
      })
    )
    sent = await sendResend({
      to: input.email,
      subject: 'Welkom bij Wittenboer Events',
      html: mail.html,
      text: mail.text,
    })
  }

  await logAudit({
    actorId: admin.id,
    action: 'artist.invited',
    entity: 'artist',
    entityId: artistId,
    metadata: {
      email: input.email,
      via: useResend ? 'resend' : 'supabase',
      mailSent: sent.ok,
      mailError: sent.error,
    },
  })

  return NextResponse.json({
    ok: true,
    artist_id: artistId,
    user_id: userId,
    mailSent: sent.ok,
    mailError: sent.error,
    via: useResend ? 'resend' : 'supabase',
  })
}
