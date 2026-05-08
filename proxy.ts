import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Geen Supabase env? Skip auth-refresh, ga door zonder bescherming. Portals
  // crashen later netjes met een duidelijke melding op /portal/login.
  if (!url || !anon) return response

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (path.startsWith('/portal/') && path !== '/portal/login' && !user) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/portal/login'
    redirect.searchParams.set('next', path)
    return NextResponse.redirect(redirect)
  }

  // Al ingelogd én op /portal/login? Stuur door naar role-default.
  if (path === '/portal/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const target =
      profile?.role === 'admin'
        ? '/portal/admin'
        : profile?.role === 'artist'
          ? '/portal/artiest'
          : '/'
    const redirect = request.nextUrl.clone()
    redirect.pathname = target
    redirect.search = ''
    return NextResponse.redirect(redirect)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/cron|api/calendar|api/oauth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
