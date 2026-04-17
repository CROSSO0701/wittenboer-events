'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { home } from '../../lib/content/home'
import { testimonials } from '../../lib/content/testimonials'

const SPECS = [
  { k: 'Locatie', v: 'Schijndel' },
  { k: 'Editie', v: '2023' },
  { k: 'Podia', v: 'Drie' },
  { k: 'Klachten buurt', v: 'Nul' },
]

export function FeaturedWork() {
  const { featuredWork } = home
  const t = testimonials[0]
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], [1.18, 1])
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])

  return (
    <section
      id="werk"
      className="relative py-24 md:py-36"
      style={{
        backgroundColor: 'var(--color-surface-dark)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset">
        {/* Kicker row */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="inline-block h-px w-8" style={{ backgroundColor: 'var(--color-primary)' }} />
              <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                {featuredWork.label} · Case 01
              </p>
            </div>
            <h2
              className="max-w-[22ch]"
              style={{
                color: 'var(--color-fg-on-dark)',
                fontSize: 'clamp(2.25rem, 1.6rem + 3vw, 4.25rem)',
                letterSpacing: '-0.035em',
                lineHeight: 0.98,
                fontWeight: 600,
              }}
            >
              {featuredWork.headingLead}{' '}
              <span style={{ color: 'var(--color-primary-soft)', fontWeight: 400, fontStyle: 'italic' }}>
                {featuredWork.headingEmph}
              </span>
            </h2>
          </div>
        </div>

        {/* Hero photo */}
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
              background:
                'linear-gradient(180deg, transparent 55%, color-mix(in oklch, var(--color-surface-dark) 70%, transparent))',
            }}
          />

          {/* Photo caption */}
          <div
            className="absolute left-5 right-5 bottom-5 md:left-8 md:right-8 md:bottom-7 flex items-end justify-between mono"
            style={{ color: 'var(--color-fg-on-dark)' }}
          >
            <span style={{ opacity: 0.9 }}>Park Lounge — mainstage</span>
            <span style={{ opacity: 0.9 }}>Schijndel · 2023</span>
          </div>
        </div>

        {/* Specs row */}
        <dl
          className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-0"
          style={{ borderTop: '0.5px solid var(--color-border-on-dark)' }}
        >
          {SPECS.map((s, i) => (
            <div
              key={s.k}
              className="py-5 md:py-6 md:px-6 md:first:pl-0"
              style={{
                borderLeft: i > 0 ? '0.5px solid var(--color-border-on-dark)' : undefined,
                paddingLeft: i > 0 ? '1.5rem' : 0,
              }}
            >
              <dt className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                {s.k}
              </dt>
              <dd
                className="mt-2"
                style={{
                  color: 'var(--color-fg-on-dark)',
                  fontSize: 'clamp(1.25rem, 1rem + 0.8vw, 1.75rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  fontStyle: i === 3 ? 'italic' : 'normal',
                }}
              >
                {s.v}
              </dd>
            </div>
          ))}
        </dl>

        {/* Body + Testimonial */}
        <div className="mt-16 grid gap-12 md:grid-cols-[1.3fr_1fr] md:items-start">
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
