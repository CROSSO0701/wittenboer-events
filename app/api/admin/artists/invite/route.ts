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

function friendlyAuthError(msg?: string | null): string {
  if (!msg) return 'Uitnodigen faalde.'
  const m = msg.toLowerCase()
  if (m.includes('already') && (m.includes('registered') || m.includes('exists'))) {
    return 'Deze e-mail heeft al een account. Koppel via "Bestaande artiest" of laat ze inloggen op /portal/login.'
  }
  if (m.includes('rate limit')) {
    return 'Te veel invites verstuurd. Probeer over een uur opnieuw, of stel Resend in voor onbeperkte mail.'
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Ongeldig e-mailadres.'
  }
  return `Uitnodigen faalde: ${msg}`
}

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

  // 0. Check of dit e-mailadres al aan een artiest hangt — voorkomt
  //    dubbele koppelingen (1 user kan maar bij 1 artiest horen).
  const { data: emailProfile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', input.email)
    .maybeSingle()

  if (emailProfile?.id) {
    const { data: linkedArtist } = await supabase
      .from('artists')
      .select('id, stage_name')
      .eq('profile_id', emailProfile.id)
      .maybeSingle()
    if (linkedArtist && (!input.artist_id || linkedArtist.id !== input.artist_id)) {
      return NextResponse.json(
        {
          error: `Dit e-mailadres is al gekoppeld aan artiest "${linkedArtist.stage_name}". Trek eerst de toegang in als je opnieuw wilt uitnodigen.`,
        },
        { status: 409 }
      )
    }
  }

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
    if (existing.profile_id && existing.profile_id !== emailProfile?.id) {
      return NextResponse.json({ error: 'Deze artiest heeft al toegang.' }, { status: 409 })
    }
    artistName = existing.stage_name
  } else if (input.stage_name) {
    // Voorkom dupes — check of er al een artiest met deze (genormaliseerde) naam bestaat
    const baseSlug = slugFor(input.stage_name)
    const { data: existingByName } = await supabase
      .from('artists')
      .select('id, stage_name, profile_id')
      .eq('slug', baseSlug)
      .maybeSingle()

    if (existingByName) {
      if (existingByName.profile_id) {
        return NextResponse.json(
          {
            error: `Er is al een artiest "${existingByName.stage_name}" met toegang. Kies een andere naam, of gebruik "Bestaande artiest" en trek eerst de toegang in.`,
          },
          { status: 409 }
        )
      }
      // Bestaande lege rij hergebruiken
      artistId = existingByName.id
      artistName = existingByName.stage_name
    } else {
      const { data: created, error: createErr } = await supabase
        .from('artists')
        .insert({
          stage_name: input.stage_name,
          slug: baseSlug,
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
  }

  // 2. User-resolution: bestond al (van emailProfile-lookup eerder) of nieuw.
  // Magic-link/invite codes moeten via /auth/callback uitgewisseld worden voor
  // een sessie. Daarna stuurt callback door naar de juiste pagina o.b.v. rol.
  const redirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent('/portal/account?welcome=1')}`
  const useResend = !!process.env.RESEND_API_KEY
  let userId: string | undefined = emailProfile?.id
  let actionLink: string | undefined
  const reusedExisting = !!emailProfile?.id

  if (!reusedExisting) {
    try {
      if (useResend) {
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: 'invite',
          email: input.email,
          options: { redirectTo, data: { full_name: artistName ?? '' } },
        })
        if (linkErr || !linkData) {
          return NextResponse.json(
            { error: friendlyAuthError(linkErr?.message), detail: linkErr?.message },
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
            { error: friendlyAuthError(inviteErr?.message), detail: inviteErr?.message },
            { status: 500 }
          )
        }
        userId = inviteData.user.id
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: friendlyAuthError(msg), detail: msg },
        { status: 500 }
      )
    }
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

  // 5. Stuur mail. Voor bestaande users genereren we een verse magic-link
  //    (i.p.v. invite-link, want die bestaat al). Dan via Resend versturen.
  let sent: { ok: boolean; error?: string } = { ok: false, error: 'geen mail-poging' }
  let linkToSend = actionLink

  if (reusedExisting && useResend) {
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: input.email,
      options: { redirectTo },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      sent = { ok: false, error: linkErr?.message ?? 'Magic-link genereren faalde' }
    } else {
      linkToSend = linkData.properties.action_link
    }
  }

  if (useResend && linkToSend) {
    const mail = await renderEmail(
      InviteMail({
        name: artistName ?? 'artiest',
        role: 'artiest',
        link: linkToSend,
      })
    )
    sent = await sendResend({
      to: input.email,
      subject: reusedExisting
        ? 'Je inloglink voor Wittenboer Events'
        : 'Welkom bij Wittenboer Events',
      html: mail.html,
      text: mail.text,
    })
  } else if (!useResend && !reusedExisting) {
    // Supabase heeft de invite-mail al verstuurd via inviteUserByEmail
    sent = { ok: true }
  } else if (!useResend && reusedExisting) {
    // Geen Resend + bestaande user: kunnen geen mail sturen
    sent = { ok: false, error: 'Bestaand account, laat ze inloggen op /portal/login' }
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
