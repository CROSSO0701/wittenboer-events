'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import MobileMenu from './MobileMenu'
import { NAV_ITEMS, type NavItem } from './nav-links'

function ChevronDown() {
  return (
    <svg
      className="nav__chevron"
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
    >
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function isActive(pathname: string, item: NavItem) {
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

export default function Nav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLLIElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
        menuTriggerRef.current?.focus()
      }
    }
    document.addEventListener('click', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [dropdownOpen])

  const overHero = pathname === '/'

  return (
    <>
      <nav className={`nav${overHero ? ' nav--over-hero' : ''}`} aria-label="Hoofdnavigatie">
        <div className="container nav__inner">
          <Link href="/" className="nav__logo" aria-label="Wittenboer Events home">
            <Image
              src="/logo/we-full.png"
              alt="Wittenboer Events"
              width={560}
              height={170}
              priority
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          <ul className="nav__links">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item)
              if (item.submenu) {
                return (
                  <li key={item.href} className="nav__has-menu" ref={menuRef}>
                    <button
                      ref={menuTriggerRef}
                      type="button"
                      className="nav__menu-trigger"
                      aria-expanded={dropdownOpen}
                      aria-haspopup="true"
                      aria-current={active ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault()
                        setDropdownOpen((v) => !v)
                      }}
                    >
                      {item.label}
                      <ChevronDown />
                    </button>
                    <div className="nav__menu">
                      <ul>
                        {item.submenu.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={() => setDropdownOpen(false)}
                            >
                              <span className="nav__menu-label">{sub.label}</span>
                              {sub.desc && <span className="nav__menu-desc">{sub.desc}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}

            <li className="nav__socials">
              <a
                href="https://www.instagram.com/wittenboerevents/"
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100054423193609"
                target="_blank"
                rel="noopener"
                aria-label="Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </li>

            <li className="nav__cta">
              <a href="tel:+31627172876">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                06 27 17 28 76
              </a>
            </li>
          </ul>

          <button
            type="button"
            className="nav__burger"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h10" />
            </svg>
          </button>
        </div>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
