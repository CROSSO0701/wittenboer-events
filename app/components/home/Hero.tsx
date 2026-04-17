'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { home } from '../../lib/content/home'
import { MagneticButton } from '../shared/MagneticButton'

const HERO_METRICS = [
  { k: 'Sinds', v: '2014' },
  { k: 'Producties', v: '400+' },
  { k: 'Klachten buren', v: 'Nul' },
]

export function Hero() {
  const { hero } = home
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%'])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ minHeight: '100dvh', backgroundColor: 'var(--color-surface-dark)' }}
    >
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

      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in oklch, var(--color-surface-dark) 70%, transparent) 0%, color-mix(in oklch, var(--color-surface-dark) 32%, transparent) 45%, color-mix(in oklch, var(--color-surface-dark) 92%, transparent) 100%)',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(110% 80% at 25% 70%, color-mix(in oklch, var(--color-surface-dark) 65%, transparent) 0%, transparent 60%)',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <motion.div
        style={{ y: textY }}
        className="relative z-20 container-inset pt-28 md:pt-40 pb-14 md:pb-20 min-h-[100dvh] flex flex-col justify-between gap-12 md:gap-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-center gap-2.5"
          style={{ color: 'var(--color-tertiary)', fontSize: '14px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          <span
            aria-hidden
            className="live-dot inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          {hero.kicker}
        </motion.div>

        <div className="flex flex-col gap-10 max-w-[1100px] mt-auto">
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{
              fontSize: 'clamp(2.75rem, 1.6rem + 7vw, 9.5rem)',
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              fontWeight: 400,
              color: 'var(--color-fg-on-dark)',
              textTransform: 'uppercase',
            }}
          >
            {hero.heading}
            <br />
            <span style={{ color: 'var(--color-tertiary)' }}>
              {hero.headingItalic}
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 0.35 }}
            className="grid gap-8 md:grid-cols-[1.1fr_auto] md:items-end"
          >
            <p
              style={{
                maxInlineSize: '52ch',
                fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)',
                color: 'var(--color-fg-on-dark-muted)',
                lineHeight: 1.55,
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
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] transition-colors duration-200"
                style={{
                  color: 'var(--color-tertiary)',
                  border: '1px solid color-mix(in oklch, var(--color-tertiary) 55%, transparent)',
                  fontWeight: 500,
                }}
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </motion.div>
        </div>

        {/* Metrics strip replacing simple caption */}
        <motion.dl
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="grid grid-cols-3 gap-6 pt-8"
          style={{ borderTop: '1px solid color-mix(in oklch, var(--color-tertiary) 30%, transparent)' }}
        >
          {HERO_METRICS.map((m, i) => (
            <div key={m.k} className={i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}>
              <dt
                style={{
                  color: 'var(--color-tertiary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {m.k}
              </dt>
              <dd
                className="uppercase"
                style={{
                  color: 'var(--color-fg-on-dark)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: 'clamp(2rem, 1.4rem + 2.4vw, 3.75rem)',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  marginTop: '6px',
                }}
              >
                {m.v}
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  )
}
