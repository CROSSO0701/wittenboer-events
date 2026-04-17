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
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1])
  const y = useTransform(scrollYProgress, [0, 1], ['-4%', '4%'])

  return (
    <section
      id="werk"
      className="relative py-20 md:py-28"
      style={{
        backgroundColor: 'var(--color-surface-dark)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset">
        <div className="mb-10 md:mb-12">
          <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
            {featuredWork.label}
          </p>
          <h2
            className="max-w-[22ch] uppercase"
            style={{
              color: 'var(--color-fg-on-dark)',
              fontSize: 'clamp(2.5rem, 1.5rem + 4vw, 5rem)',
              lineHeight: 0.95,
            }}
          >
            {featuredWork.headingLead}{' '}
            <span style={{ color: 'var(--color-primary)' }}>
              {featuredWork.headingEmph}
            </span>
          </h2>
        </div>

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
        </div>

        <div className="mt-10 md:mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-start">
          <p
            className="text-[17px] md:text-[19px]"
            style={{ color: 'var(--color-fg-on-dark-muted)', maxInlineSize: '62ch', lineHeight: 1.55 }}
          >
            {featuredWork.body}
          </p>

          <figure>
            <blockquote
              className="text-[18px]"
              style={{
                color: 'var(--color-fg-on-dark)',
                lineHeight: 1.45,
                borderLeft: '2px solid var(--color-primary)',
                paddingLeft: '1.25rem',
                fontWeight: 400,
              }}
            >
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-[14px]" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              — {t.author}, {t.role}
            </figcaption>
          </figure>
        </div>

        <div className="mt-10 md:mt-12">
          <Link
            href={featuredWork.ctaHref}
            className="group inline-flex items-center gap-2 text-[15px]"
            style={{ color: 'var(--color-fg-on-dark)', fontWeight: 500 }}
          >
            <span className="underline-offset-4 group-hover:underline">{featuredWork.ctaLabel}</span>
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
