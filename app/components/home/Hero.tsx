'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { home } from '../../lib/content/home'
import { MagneticButton } from '../shared/MagneticButton'

export function Hero() {
  const { hero } = home
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])
  const dim = useTransform(scrollYProgress, [0, 1], [0.55, 0.8])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ minHeight: '100dvh', backgroundColor: 'var(--color-surface-dark)' }}
    >
      {/* Full-bleed background photo */}
      <motion.div style={{ scale }} className="absolute inset-0 z-0">
        <Image
          src={hero.photo.src}
          alt={hero.photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Dimming overlay — dynamic with scroll */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          opacity: dim,
          background:
            'linear-gradient(180deg, color-mix(in oklch, var(--color-surface-dark) 75%, transparent) 0%, color-mix(in oklch, var(--color-surface-dark) 35%, transparent) 40%, color-mix(in oklch, var(--color-surface-dark) 85%, transparent) 100%)',
        }}
      />

      {/* Left/right tint veils for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 60%, color-mix(in oklch, var(--color-surface-dark) 55%, transparent) 0%, transparent 55%)',
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY }}
        className="relative z-20 container-inset pt-36 md:pt-44 pb-24 md:pb-32 min-h-[100dvh] flex flex-col justify-between"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-center gap-2.5 mono"
          style={{ color: 'var(--color-primary-soft)' }}
        >
          <span
            aria-hidden
            className="live-dot inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-primary-soft)' }}
          />
          {hero.kicker}
        </motion.div>

        <div className="flex flex-col gap-10 max-w-[1100px]">
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="max-w-[13ch]"
            style={{
              fontSize: 'clamp(3rem, 2rem + 7vw, 8.5rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              fontWeight: 600,
              color: 'var(--color-fg-on-dark)',
              textShadow: '0 2px 30px color-mix(in oklch, var(--color-surface-dark) 60%, transparent)',
            }}
          >
            {hero.heading}{' '}
            <em
              className="not-italic"
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--color-primary-soft)',
              }}
            >
              {hero.headingItalic}
            </em>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 0.35 }}
            className="grid gap-8 md:grid-cols-[1.1fr_auto] md:items-end"
          >
            <p
              className="text-[var(--text-lg)]"
              style={{
                maxInlineSize: 'var(--measure-lead)',
                color: 'var(--color-fg-on-dark-muted)',
              }}
            >
              {hero.lead}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton href={hero.primaryCta.href} variant="solid">
                {hero.primaryCta.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </MagneticButton>
              <a
                href={hero.secondaryCta.href}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[14px] text-[15px] font-medium tracking-tight transition-colors duration-200"
                style={{
                  color: 'var(--color-fg-on-dark)',
                  border: '0.5px solid color-mix(in oklch, var(--color-fg-on-dark) 40%, transparent)',
                }}
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bottom meta strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-end justify-between gap-6 mono"
          style={{ color: 'var(--color-fg-on-dark-muted)' }}
        >
          <div className="flex flex-col gap-1">
            <span style={{ color: 'var(--color-primary-soft)' }}>IMG · Park Lounge</span>
            <span>Schijndel / 2023</span>
          </div>
          <div className="hidden md:flex flex-col gap-1 items-end">
            <span>scroll ↓</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
