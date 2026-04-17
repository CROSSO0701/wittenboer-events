'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { NAV_LINKS } from './nav-links'

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: Props) {
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
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Navigatie"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          className="fixed inset-0 z-50"
          style={{ backgroundColor: 'var(--color-surface-dark)' }}
        >
          <div className="container-inset flex h-20 items-center justify-between">
            <Image
              src="/logo/we-mark.png"
              alt="Wittenboer Events"
              width={64}
              height={64}
              className="h-10 w-10 object-contain"
              style={{ filter: 'brightness(1.4)' }}
            />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md"
              style={{ color: 'var(--color-fg-on-dark)' }}
              aria-label="Sluit menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>

          <motion.ul
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
            className="container-inset pt-8 flex flex-col gap-1"
          >
            {NAV_LINKS.map((l) => (
              <motion.li
                key={l.href}
                variants={{
                  initial: { opacity: 0, y: 16 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] } },
                }}
              >
                <Link
                  href={l.href}
                  onClick={onClose}
                  className="block py-3 border-b"
                  style={{
                    color: 'var(--color-fg-on-dark)',
                    borderColor: 'var(--color-border-on-dark)',
                    fontSize: 'clamp(2rem, 6vw, 3.25rem)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                  }}
                >
                  {l.label}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
