'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MobileMenu } from './MobileMenu'
import { NAV_LINKS } from './nav-links'

export function Nav() {
  const [open, setOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enterMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenDropdown(label)
  }
  const leaveMenu = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120)
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <nav
          aria-label="Hoofdnavigatie"
          className="container-inset flex h-20 items-center justify-between"
        >
          <Link href="/" className="flex items-center" aria-label="Wittenboer Events home">
            <Image
              src="/logo/we-full.png"
              alt="Wittenboer Events"
              width={560}
              height={170}
              priority
              className="h-9 md:h-10 w-auto"
              style={{ objectFit: 'contain' }}
            />
          </Link>

          <ul className="hidden md:flex items-center gap-7 text-[15px]">
            {NAV_LINKS.map((l) => (
              <li
                key={l.href}
                className="relative"
                onMouseEnter={() => l.children && enterMenu(l.label)}
                onMouseLeave={() => l.children && leaveMenu()}
              >
                <Link
                  href={l.href}
                  className="group relative inline-flex items-center gap-1.5 py-2 transition-colors duration-200"
                  style={{ color: 'var(--color-fg)' }}
                >
                  <span>{l.label}</span>
                  {l.children && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="transition-transform"
                      style={{
                        transform: openDropdown === l.label ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100 transition-transform duration-300"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      transitionTimingFunction: 'var(--ease-out-quart)',
                    }}
                  />
                </Link>

                {l.children && (
                  <AnimatePresence>
                    {openDropdown === l.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute left-0 top-full pt-3"
                      >
                        <div
                          className="w-[340px] rounded-[var(--radius-lg)] p-2"
                          style={{
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 24px 48px -20px color-mix(in oklch, var(--color-fg) 20%, transparent)',
                          }}
                        >
                          <ul className="flex flex-col">
                            {l.children.map((c) => (
                              <li key={c.href}>
                                <Link
                                  href={c.href}
                                  onClick={() => setOpenDropdown(null)}
                                  className="flex flex-col gap-0.5 px-4 py-3 rounded-[var(--radius-md)] transition-colors hover:[background-color:var(--color-surface-1)]"
                                >
                                  <span
                                    className="text-[14.5px]"
                                    style={{ color: 'var(--color-fg)', fontWeight: 500 }}
                                  >
                                    {c.label}
                                  </span>
                                  {c.description && (
                                    <span className="text-[13px]" style={{ color: 'var(--color-fg-muted)' }}>
                                      {c.description}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </li>
            ))}

            <li className="pl-4 ml-2" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <a
                href="tel:+31627172876"
                className="inline-flex items-center gap-2 py-2 px-4 rounded-full transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-fg-on-dark)',
                  fontSize: '14px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                06 27 17 28 76
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
