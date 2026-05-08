import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthError, requireAdmin } from '../../../../../../lib/auth/helpers'
import { createSupabaseAdminClient } from '../../../../../../lib/db/server'

type InquiryTable = 'contact_inquiries' | 'disco_inquiries' | 'artist_booking_inquiries'

const TABLE_BY_TYPE: Record<string, InquiryTable> = {
  contact: 'contact_inquiries',
  'show-package': 'disco_inquiries',
  'artist-booking': 'artist_booking_inquiries',
}

const CONTACT_STATUS = z.enum(['new', 'replied', 'closed'])
const INQUIRY_STATUS = z.enum(['new', 'contacted', 'quoted', 'booked', 'closed'])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    await requireAdmin()
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }

  const { type, id } = await params
  const table = TABLE_BY_TYPE[type]
  if (!table) {
    return NextResponse.json({ error: 'Onbekend aanvraag-type.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const schema = type === 'contact' ? CONTACT_STATUS : INQUIRY_STATUS
  const parsed = z.object({ status: schema }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige status.', issues: parsed.error.issues }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from(table).update({ status: parsed.data.status }).eq('id', id)
  if (error) {
    return NextResponse.json({ error: 'Database-fout.', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
