'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MobileMenu } from './MobileMenu'
import { NAV_LINKS } from './nav-links'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300"
        style={{
          backgroundColor: scrolled ? 'color-mix(in oklch, var(--color-bg) 85%, transparent)' : 'transparent',
          backdropFilter: scrolled ? 'saturate(140%) blur(12px)' : undefined,
          WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(12px)' : undefined,
          borderBottom: scrolled ? '0.5px solid var(--color-border)' : '0.5px solid transparent',
        }}
      >
        <nav
          aria-label="Hoofdnavigatie"
          className="container-inset flex h-16 items-center justify-between"
        >
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Wittenboer Events — home">
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-bold tracking-tight transition-transform duration-300 group-hover:rotate-[-4deg]"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-fg-on-dark)',
              }}
            >
              WE
            </span>
            <span className="hidden sm:inline text-[15px] tracking-tight" style={{ fontWeight: 600 }}>
              Wittenboer Events
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-7 text-[14px]">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="group relative inline-flex items-center transition-colors duration-200"
                  style={{ color: 'var(--color-fg)' }}
                >
                  <span>{l.label}</span>
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-1 h-px origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100 transition-transform duration-300"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      transitionTimingFunction: 'var(--ease-out-quart)',
                    }}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md"
            style={{ color: 'var(--color-fg)' }}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h10" />
            </svg>
          </button>
        </nav>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}
