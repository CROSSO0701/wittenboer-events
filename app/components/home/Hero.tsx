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

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-dark)' }}
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

      {/* Slate-family overlay for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(26,36,44,0.70) 0%, rgba(26,36,44,0.30) 40%, rgba(26,36,44,0.88) 100%)',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(100% 70% at 15% 70%, rgba(26,36,44,0.55) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-20 container-inset pt-36 md:pt-48 pb-20 md:pb-24 flex flex-col gap-14 md:gap-20">
        {/* Kicker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-center gap-2.5"
          style={{ color: 'var(--color-tertiary)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          {hero.kicker}
        </motion.div>

        {/* Main headline */}
        <div className="flex flex-col gap-10 max-w-[1200px]">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{
              fontSize: 'clamp(2.75rem, 1.4rem + 7.5vw, 9rem)',
              lineHeight: 1.05,
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
                fontSize: 'clamp(1rem, 0.9rem + 0.35vw, 1.2rem)',
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
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] transition-colors duration-200 hover:[background-color:rgba(255,255,255,0.08)]"
                style={{
                  color: 'var(--color-fg-on-dark)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  fontWeight: 500,
                }}
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </motion.div>
        </div>

        {/* Metrics strip */}
        <motion.dl
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="grid grid-cols-3 gap-4 md:gap-10 pt-8 md:pt-10"
          style={{ borderTop: '1px solid rgba(255,255,255,0.18)' }}
        >
          {HERO_METRICS.map((m, i) => (
            <div key={m.k} className={i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}>
              <dt
                style={{
                  color: 'var(--color-tertiary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
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
                  fontSize: 'clamp(1.75rem, 1.2rem + 2.4vw, 3.5rem)',
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  marginTop: '8px',
                }}
              >
                {m.v}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}
