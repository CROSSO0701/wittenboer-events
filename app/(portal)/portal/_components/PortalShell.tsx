'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Inbox,
  Download,
  CalendarDays,
  Users,
  UsersRound,
  Music,
  Plug,
  Music2,
  UserCog,
  Archive,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '../../../lib/db/client'
import { cn } from '../../../lib/utils/cn'
import { InstallAppButton } from './InstallAppButton'

type Role = 'admin' | 'artist' | 'staff' | null
type Session = { email: string | null; fullName: string | null; role: Role } | null

/** Nette Nederlandse labels per rol, geen ruwe codes naar gebruikers tonen. */
const ROLE_LABELS: Record<'admin' | 'artist' | 'staff', string> = {
  admin: 'Beheerder',
  artist: 'Artiest',
  staff: 'Crew',
}

function roleLabel(role: Role | undefined): string | null {
  return role ? ROLE_LABELS[role] : null
}

type NavItem = {
  href: string
  label: string
  /** Header-titel voor deze route. Standaard gelijk aan `label`. */
  title?: string
  icon: typeof Inbox
}

/** Header-titel afgeleid uit de (samengevoegde) nav-array — één bron, geen losse map. */
function pageTitleFor(pathname: string, nav: NavItem[]): string {
  const exact = nav.find((item) => item.href === pathname)
  if (exact) return exact.title ?? exact.label
  // Expliciete fallbacks voor routes zonder eigen nav-item.
  if (pathname.startsWith('/portal/admin/klanten/')) return 'Klantdetail'
  if (pathname === '/portal/account') return 'Account'
  return 'Portal'
}

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [drawer, setDrawer] = useState(false)

  useEffect(() => setDrawer(false), [pathname])

  useEffect(() => {
    let cancelled = false
    let supabase
    try {
      supabase = createSupabaseBrowserClient()
    } catch {
      return
    }
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setSession({ email: null, fullName: null, role: null })
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      setSession({
        email: user.email ?? null,
        fullName: profile?.full_name ?? null,
        role: (profile?.role as Role) ?? null,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function logout() {
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      toast.success('Uitgelogd')
      router.replace('/portal/login')
      router.refresh()
    } catch {
      toast.error('Uitloggen faalde')
    }
  }

  const role = session?.role
  // Nav-set wordt afgeleid van pathname EERST (zodat de juiste shell direct
  // verschijnt zonder te wachten tot session/role zijn geladen). Pas als de
  // path geen context geeft (/portal/account losstaand), valt-ie terug op rol.
  const inAdminArea = pathname.startsWith('/portal/admin')
  const inArtistArea = pathname.startsWith('/portal/artiest')
  const inCrewArea = pathname.startsWith('/portal/crew')

  const isAdmin = inAdminArea || role === 'admin'
  const isArtist = !isAdmin && (inArtistArea || role === 'artist')
  const isCrew = !isAdmin && !isArtist && (inCrewArea || role === 'staff')

  // Primaire nav (dagelijks gebruik) — bovenaan de sidebar.
  const primaryItems: NavItem[] = isAdmin
    ? [
        { href: '/portal/admin', label: 'Te doen', icon: Inbox },
        { href: '/portal/admin/inkomend', label: 'Inkomend', icon: Download },
        { href: '/portal/admin/agenda', label: 'Agenda', icon: CalendarDays },
        { href: '/portal/admin/klanten', label: 'Klanten', icon: UsersRound },
        { href: '/portal/admin/personeel', label: 'Crew', icon: Users },
        { href: '/portal/admin/artiesten', label: 'Artiesten', icon: Music },
      ]
    : isArtist
      ? [{ href: '/portal/artiest', label: 'Mijn aanvragen', icon: Music2 }]
      : isCrew
        ? [{ href: '/portal/crew', label: 'Mijn klussen', icon: CalendarDays }]
        : []

  // Instellingen (zelden gebruikt) — ingetogen sectie in de sidebar-footer.
  // Account schuift mee in deze groep.
  const settingsItems: NavItem[] = isAdmin
    ? [
        { href: '/portal/admin/integraties', label: 'Integraties', icon: Plug },
        { href: '/portal/admin/log', label: 'Activiteit', icon: Activity },
        { href: '/portal/admin/archief', label: 'Archief', icon: Archive },
        { href: '/portal/account', label: 'Account', icon: UserCog },
      ]
    : [{ href: '/portal/account', label: 'Account', icon: UserCog }]

  // Eén samengevoegde array voor titel-afleiding (primair + instellingen).
  const allNavItems: NavItem[] = [...primaryItems, ...settingsItems]

  // Subtitle kiest dezelfde logica
  const subtitleRole = inAdminArea
    ? ROLE_LABELS.admin
    : inArtistArea
      ? ROLE_LABELS.artist
      : inCrewArea
        ? ROLE_LABELS.staff
        : roleLabel(role) ?? 'Portal'

  const initial = (session?.fullName ?? session?.email ?? 'WE').slice(0, 1).toUpperCase()

  return (
    <div className="flex min-h-[100dvh]">
      {/* Mobile drawer overlay */}
      {drawer && (
        <button
          aria-label="Sluit menu"
          onClick={() => setDrawer(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[var(--color-secondary-darker)] text-[var(--color-fg-on-dark)] transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          drawer ? 'translate-x-0' : '-translate-x-full',
          'lg:flex-shrink-0'
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link
            href={
              role === 'artist'
                ? '/portal/artiest'
                : role === 'staff'
                  ? '/portal/crew'
                  : '/portal/admin'
            }
            className="flex items-center gap-3"
          >
            <Image
              src="/logo/we-mark.png"
              alt="Wittenboer"
              width={64}
              height={64}
              style={{ filter: 'brightness(0) invert(1)', height: 28, width: 'auto' }}
            />
            <div className="flex flex-col leading-tight">
              <span className="font-[family-name:var(--font-display)] text-sm uppercase tracking-wide">
                Wittenboer
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">
                {subtitleRole}
              </span>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Sluit menu"
            onClick={() => setDrawer(false)}
            className="rounded-md p-1 hover:bg-white/5 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 pb-4">
          <ul className="flex flex-col gap-0.5">
            {primaryItems.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-fg-on-dark)] shadow-[inset_2px_0_0_var(--color-primary)]'
                        : 'text-[var(--color-fg-on-dark-muted)] hover:bg-white/5 hover:text-[var(--color-fg-on-dark)]'
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          {/* Instellingen — ingetogen, kleiner lettertype, gescheiden van de primaire nav. */}
          <div>
            <div className="flex items-center gap-2 px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-fg-on-dark-muted)]">
              <Settings size={12} className="shrink-0" />
              <span>Instellingen</span>
            </div>
            <ul className="flex flex-col gap-0.5">
              {settingsItems.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors',
                        active
                          ? 'bg-[var(--color-primary)]/15 text-[var(--color-fg-on-dark)] shadow-[inset_2px_0_0_var(--color-primary)]'
                          : 'text-[var(--color-fg-on-dark-muted)] hover:bg-white/5 hover:text-[var(--color-fg-on-dark)]'
                      )}
                    >
                      <Icon size={13} className="shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {/* Installeer-de-portal-als-app: zichtbaar voor alle rollen, rendert
                zichzelf alleen als installeren daadwerkelijk kan. */}
            <div className="mt-0.5">
              <InstallAppButton />
            </div>
          </div>

          {/* Account-identiteit + uitloggen. */}
          <div className="mt-3 flex items-center gap-3 rounded-lg p-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--color-fg-on-dark)]">
                {session?.fullName ?? session?.email ?? '...'}
              </div>
              {roleLabel(role) && (
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-tertiary)]">
                  {roleLabel(role)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Uitloggen"
              title="Uitloggen"
              className="shrink-0 rounded-md p-1.5 text-[var(--color-fg-on-dark-muted)] hover:bg-white/5 hover:text-[var(--color-fg-on-dark)]"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawer(true)}
              className="rounded-md p-1.5 text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-1)] lg:hidden"
            >
              <Menu size={18} />
            </button>
            <h1 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-wide text-[var(--color-fg)]">
              {pageTitleFor(pathname, allNavItems)}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
            <span className="hidden sm:inline">
              {new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
