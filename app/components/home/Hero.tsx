'use client'

import Image from 'next/image'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { home } from '../../lib/content/home'
import { MagneticButton } from '../shared/MagneticButton'

export function Hero() {
  const { hero } = home
  const wrap = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 80, damping: 18, mass: 0.6 })
  const smy = useSpring(my, { stiffness: 80, damping: 18, mass: 0.6 })
  const tx = useTransform(smx, (v) => v * -22)
  const ty = useTransform(smy, (v) => v * -22)

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.14])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mx.set((e.clientX - r.left) / r.width - 0.5)
      my.set((e.clientY - r.top) / r.height - 0.5)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [mx, my])

  return (
    <section
      ref={wrap}
      className="relative overflow-hidden"
      style={{ minHeight: '100dvh' }}
    >
      {/* Marginalia — left rail, desktop only */}
      <aside
        aria-hidden
        className="hidden lg:flex flex-col gap-6 absolute left-6 top-28 z-10 mono"
        style={{ color: 'var(--color-fg-muted)' }}
      >
        <div className="flex flex-col gap-1">
          <span style={{ color: 'var(--color-primary)' }}>51.6394° N</span>
          <span>5.3525° E</span>
        </div>
        <div className="flex flex-col gap-1">
          <span>EST. 2014</span>
          <span>NL · Noord-Brabant</span>
        </div>
      </aside>

      {/* Scroll indicator — right rail */}
      <aside
        aria-hidden
        className="hidden lg:flex flex-col items-center gap-3 absolute right-6 bottom-10 z-10 mono"
        style={{ color: 'var(--color-fg-muted)' }}
      >
        <span className="rotate-90 origin-center translate-y-8 whitespace-nowrap">scroll ↓</span>
        <span
          className="block w-px"
          style={{ height: '64px', backgroundColor: 'var(--color-border-strong)' }}
        />
      </aside>

      <div className="container-inset relative pt-10 pb-12 md:pt-14 md:pb-16 grid gap-8 md:gap-10 md:grid-cols-[1.2fr_0.95fr] md:items-center min-h-[calc(100dvh-4rem)]">
        <motion.div
          initial="initial"
          animate="animate"
          style={{ y: titleY }}
          variants={{ animate: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}
          className="flex flex-col gap-7 relative z-20"
        >
          <motion.div
            variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } } }}
            className="flex items-center gap-2.5 mono"
            style={{ color: 'var(--color-fg-secondary)' }}
          >
            <span
              aria-hidden
              className="live-dot inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
            {hero.kicker}
          </motion.div>

          <motion.h1
            variants={{ initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}
            className="max-w-[13ch]"
            style={{
              fontSize: 'clamp(3rem, 2rem + 5vw, 6.5rem)',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              fontWeight: 600,
            }}
          >
            {hero.heading}
            <br />
            <em
              className="not-italic"
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--color-primary)',
              }}
            >
              {hero.headingItalic}
            </em>
          </motion.h1>

          <motion.p
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } } }}
            className="text-[var(--text-lg)]"
            style={{ maxInlineSize: 'var(--measure-lead)', color: 'var(--color-fg-secondary)' }}
          >
            {hero.lead}
          </motion.p>

          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } } }}
            className="flex flex-wrap items-center gap-3 mt-1"
          >
            <MagneticButton href={hero.primaryCta.href} variant="solid">
              {hero.primaryCta.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </MagneticButton>
            <MagneticButton href={hero.secondaryCta.href} variant="ghost">
              {hero.secondaryCta.label}
            </MagneticButton>
          </motion.div>

          {/* Micro-specs row — proof of trade */}
          <motion.dl
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 0.2 } } }}
            className="grid grid-cols-3 gap-6 mt-8 pt-6"
            style={{ borderTop: '0.5px solid var(--color-border)' }}
          >
            {[
              { k: '10+', v: 'jaar ervaring' },
              { k: '500kVA', v: 'stroomcapaciteit' },
              { k: '120dB', v: 'gericht vermogen' },
            ].map((s) => (
              <div key={s.v} className="flex flex-col gap-1">
                <dt
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.375rem, 1.1rem + 0.9vw, 1.875rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.025em',
                    color: 'var(--color-fg)',
                  }}
                >
                  {s.k}
                </dt>
                <dd className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                  {s.v}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[4/5] md:aspect-[3/4] md:translate-y-6 overflow-hidden rounded-[var(--radius-xl)]"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
        >
          <motion.div style={{ x: tx, y: ty, scale: photoScale }} className="absolute inset-0">
            <Image
              src={hero.photo.src}
              alt={hero.photo.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </motion.div>
          {/* Top gradient for depth */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in oklch, var(--color-surface-dark) 30%, transparent) 0%, transparent 30%, transparent 60%, color-mix(in oklch, var(--color-surface-dark) 55%, transparent) 100%)',
            }}
          />
          {/* Grain overlay */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />
          {/* Caption */}
          <div
            className="absolute bottom-5 left-5 right-5 flex items-end justify-between mono"
            style={{ color: 'var(--color-fg-on-dark)' }}
          >
            <span style={{ opacity: 0.9 }}>IMG · 001</span>
            <span style={{ opacity: 0.9 }}>Park Lounge / 2023</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
