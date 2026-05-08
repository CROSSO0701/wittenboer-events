'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { NAV_ITEMS } from './nav-links'

type Props = {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: Props) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div
      className={`mobile-menu${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigatie"
      aria-hidden={!open}
    >
      <div className="mobile-menu__head">
        <span className="mono" style={{ color: 'var(--color-fg-muted)' }}>Menu</span>
        <button
          type="button"
          className="mobile-menu__close"
          aria-label="Sluit menu"
          onClick={onClose}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="mobile-menu__list">
        <Link
          href="/"
          onClick={onClose}
          aria-current={isActive('/') ? 'page' : undefined}
        >
          Home
          <span aria-hidden>→</span>
        </Link>
        {NAV_ITEMS.map((item) =>
          item.submenu ? (
            <details key={item.href} open={isActive(item.href)}>
              <summary aria-current={isActive(item.href) ? 'page' : undefined}>
                {item.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="mobile-menu__sublist">
                {item.submenu.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClose}
                    aria-current={pathname === sub.href ? 'page' : undefined}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            </details>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
              <span aria-hidden>→</span>
            </Link>
          )
        )}
      </div>

      <div className="mobile-menu__foot">
        <a href="tel:+31627172876" className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          06 27 17 28 76
        </a>
        <a href="mailto:info@wittenboerevents.nl" className="btn-ghost">info@wittenboerevents.nl</a>
      </div>
    </div>
  )
}
