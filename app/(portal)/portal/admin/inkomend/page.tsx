import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../../lib/db/server'
import { InkomendBoard } from './InkomendBoard'

export const metadata: Metadata = { title: 'Inkomend' }
export const dynamic = 'force-dynamic'

export default async function InkomendPage() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login?next=/portal/admin/inkomend')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/portal/account')

  return <InkomendBoard />
}
