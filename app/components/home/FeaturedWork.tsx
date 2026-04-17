'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { home } from '../../lib/content/home'
import { testimonials } from '../../lib/content/testimonials'

export function FeaturedWork() {
  const { featuredWork } = home
  const t = testimonials[0]
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1])
  const y = useTransform(scrollYProgress, [0, 1], ['-4%', '4%'])

  return (
    <section
      id="werk"
      className="relative py-24 md:py-32"
      style={{
        backgroundColor: 'var(--color-surface-dark)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset">
        <div className="mb-10 flex items-center gap-3">
          <span aria-hidden className="inline-block h-px w-8" style={{ backgroundColor: 'var(--color-primary)' }} />
          <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
            {featuredWork.label}
          </p>
        </div>

        <h2 className="max-w-[22ch] mb-12" style={{ color: 'var(--color-fg-on-dark)' }}>
          {featuredWork.headingLead}{' '}
          <span style={{ color: 'var(--color-primary-soft)', fontWeight: 400, fontStyle: 'italic' }}>
            {featuredWork.headingEmph}
          </span>
        </h2>

        <div
          ref={ref}
          className="relative aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-[var(--radius-xl)]"
        >
          <motion.div style={{ scale, y }} className="absolute inset-0">
            <Image
              src={featuredWork.photo}
              alt="Park Lounge Festival Schijndel"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 50%, color-mix(in oklch, var(--color-surface-dark) 60%, transparent))',
            }}
          />
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-start">
          <p
            className="text-[var(--text-lg)]"
            style={{ color: 'var(--color-fg-on-dark-muted)', maxInlineSize: 'var(--measure-body)' }}
          >
            {featuredWork.body}
          </p>

          <figure>
            <blockquote
              className="text-[19px]"
              style={{
                color: 'var(--color-fg-on-dark)',
                lineHeight: 1.4,
                borderLeft: '0.5px solid var(--color-primary)',
                paddingLeft: '1.25rem',
              }}
            >
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              {t.author} — {t.role}
            </figcaption>
          </figure>
        </div>

        <div className="mt-14">
          <Link
            href={featuredWork.ctaHref}
            className="group inline-flex items-center gap-2"
            style={{ color: 'var(--color-fg-on-dark)' }}
          >
            <span>{featuredWork.ctaLabel}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="transition-transform group-hover:translate-x-1"
              style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
