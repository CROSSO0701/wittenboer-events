import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/db/server'

export default async function PortalIndex() {
  let supabase
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    redirect('/portal/login')
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role === 'admin') redirect('/portal/admin')
  if (profile?.role === 'artist') redirect('/portal/artiest')
  redirect('/')
}
