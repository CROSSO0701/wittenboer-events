'use client'

import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
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
  const tx = useTransform(smx, (v) => v * -16)
  const ty = useTransform(smy, (v) => v * -16)

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
      <div className="container-inset relative pt-10 pb-16 md:pt-16 md:pb-24 grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center min-h-[calc(100dvh-4rem)]">
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          className="flex flex-col gap-6"
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
            variants={{ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] } } }}
            className="max-w-[15ch]"
          >
            {hero.heading}{' '}
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
            className="flex flex-wrap items-center gap-3 mt-2"
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="relative aspect-[4/5] md:aspect-[3/4] rounded-[var(--radius-xl)] overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
        >
          <motion.div style={{ x: tx, y: ty, scale: 1.08 }} className="absolute inset-0">
            <Image
              src={hero.photo.src}
              alt={hero.photo.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </motion.div>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 60%, color-mix(in oklch, var(--color-surface-dark) 40%, transparent))',
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}
