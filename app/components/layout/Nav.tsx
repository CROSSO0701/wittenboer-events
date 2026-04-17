'use client'

import Image from 'next/image'
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
        className="fixed top-0 left-0 right-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300"
        style={{
          backgroundColor: scrolled
            ? 'color-mix(in oklch, var(--color-bg) 80%, transparent)'
            : 'transparent',
          backdropFilter: scrolled ? 'saturate(140%) blur(14px)' : undefined,
          WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(14px)' : undefined,
          borderBottom: scrolled ? '0.5px solid var(--color-border)' : '0.5px solid transparent',
        }}
      >
        <nav
          aria-label="Hoofdnavigatie"
          className="container-inset flex h-20 items-center justify-between"
        >
          <Link href="/" className="flex items-center group" aria-label="Wittenboer Events — home">
            <Image
              src="/logo/we-full.png"
              alt="Wittenboer Events"
              width={560}
              height={170}
              priority
              className="h-9 md:h-10 w-auto transition-opacity duration-300"
              style={{ objectFit: 'contain' }}
            />
          </Link>

          <ul className="hidden md:flex items-center gap-8 text-[14px]">
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
                    className="absolute left-0 right-0 -bottom-1.5 h-px origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100 transition-transform duration-300"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      transitionTimingFunction: 'var(--ease-out-quart)',
                    }}
                  />
                </Link>
              </li>
            ))}
            <li className="pl-2 ml-2" style={{ borderLeft: '0.5px solid var(--color-border)' }}>
              <a
                href="tel:+31627172876"
                className="mono transition-colors duration-200"
                style={{ color: 'var(--color-primary)' }}
              >
                06 · 27 17 28 76
              </a>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md"
            style={{ color: 'var(--color-fg)' }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
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
