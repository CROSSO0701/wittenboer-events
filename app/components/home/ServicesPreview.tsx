import Image from 'next/image'
import Link from 'next/link'
import { home } from '../../lib/content/home'
import { services } from '../../lib/content/services'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ServicesPreview() {
  const bySlug = (slug: string) => services.find((s) => s.slug === slug)!
  const geluid = bySlug('geluid')
  const licht = bySlug('licht')
  const tape = bySlug('tapeshows')
  const stroom = bySlug('stroomvoorziening')
  const artiesten = bySlug('artiestenbegeleiding')
  const productie = bySlug('productiebegeleiding')

  return (
    <section id="diensten" className="py-24 md:py-32 relative">
      <div className="container-inset">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              {home.services.label} · 06
            </p>
            <h2 className="max-w-[16ch]">{home.services.heading}</h2>
          </div>
          <p className="max-w-[44ch]" style={{ color: 'var(--color-fg-secondary)' }}>
            {home.services.lead}
          </p>
        </div>

        <StaggerReveal className="grid gap-4 md:grid-cols-12 md:auto-rows-[minmax(180px,auto)]">
          {/* 01 — Geluid, large hero card */}
          <RevealItem className="md:col-span-7 md:row-span-2">
            <Link
              href={`/aanbod/${geluid.slug}`}
              className="group relative block h-full min-h-[420px] overflow-hidden rounded-[var(--radius-xl)] transition-colors"
              style={{ backgroundColor: 'var(--color-surface-dark)' }}
            >
              {geluid.image && (
                <Image
                  src={geluid.image}
                  alt={geluid.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-cover opacity-90 transition-transform duration-[900ms] group-hover:scale-[1.04]"
                  style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 20%, color-mix(in oklch, var(--color-surface-dark) 85%, transparent))',
                }}
              />
              <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-10" style={{ color: 'var(--color-fg-on-dark)' }}>
                <div className="flex items-start justify-between gap-4">
                  <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                    01 · Dienst
                  </p>
                  <span
                    className="mono px-2 py-1"
                    style={{
                      border: '0.5px solid color-mix(in oklch, var(--color-primary-soft) 40%, transparent)',
                      color: 'var(--color-primary-soft)',
                    }}
                  >
                    L-Acoustics · d&b
                  </span>
                </div>
                <div>
                  <h3
                    style={{
                      color: 'var(--color-fg-on-dark)',
                      fontWeight: 600,
                      fontSize: 'clamp(2rem, 1.5rem + 2vw, 3.25rem)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {geluid.title}
                  </h3>
                  <p className="mt-4 max-w-[42ch]" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                    {geluid.lead}
                  </p>
                </div>
              </div>
            </Link>
          </RevealItem>

          {/* 02 — Licht */}
          <RevealItem className="md:col-span-5">
            <Link
              href={`/aanbod/${licht.slug}`}
              className="group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 md:p-7 transition-colors hover:[background-color:var(--color-surface-1)]"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between">
                <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                  02 · Dienst
                </p>
                <span className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                  grandMA · Hog
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600, letterSpacing: '-0.025em' }}>{licht.title}</h3>
                <p className="mt-2 text-[15px]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {licht.lead}
                </p>
              </div>
            </Link>
          </RevealItem>

          {/* 03 — Artiestenbegeleiding */}
          <RevealItem className="md:col-span-5">
            <Link
              href={`/aanbod/${artiesten.slug}`}
              className="group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 md:p-7 transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--color-primary-soft)',
                border: '0.5px solid color-mix(in oklch, var(--color-primary) 25%, transparent)',
                transitionTimingFunction: 'var(--ease-out-quart)',
                transitionDuration: 'var(--dur-base)',
              }}
            >
              <div className="flex items-start justify-between">
                <p className="mono" style={{ color: 'var(--color-primary-deep)' }}>
                  03 · Dienst
                </p>
                <span className="mono" style={{ color: 'var(--color-primary-deep)', opacity: 0.7 }}>
                  Ned. top-artiesten
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600, color: 'var(--color-primary-deep)', letterSpacing: '-0.025em' }}>
                  {artiesten.title}
                </h3>
                <p className="mt-2 text-[15px]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {artiesten.lead}
                </p>
              </div>
            </Link>
          </RevealItem>

          {/* 04 — Tapeshows */}
          <RevealItem className="md:col-span-4">
            <Link
              href={`/aanbod/${tape.slug}`}
              className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 transition-colors hover:[background-color:var(--color-surface-1)]"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                04 · Dienst
              </p>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em' }}>{tape.title}</h3>
                <p className="mt-2 text-[14px]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {tape.lead}
                </p>
              </div>
            </Link>
          </RevealItem>

          {/* 05 — Stroomvoorziening */}
          <RevealItem className="md:col-span-4">
            <Link
              href={`/aanbod/${stroom.slug}`}
              className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 transition-colors hover:[background-color:var(--color-surface-1)]"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between">
                <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                  05 · Dienst
                </p>
                <span className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                  25–500 kVA
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em' }}>{stroom.title}</h3>
                <p className="mt-2 text-[14px]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {stroom.lead}
                </p>
              </div>
            </Link>
          </RevealItem>

          {/* 06 — Productiebegeleiding */}
          <RevealItem className="md:col-span-4">
            <Link
              href={`/aanbod/${productie.slug}`}
              className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-dark-1)',
                color: 'var(--color-fg-on-dark)',
              }}
            >
              <div className="flex items-start justify-between">
                <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                  06 · Dienst
                </p>
                <span className="mono" style={{ color: 'var(--color-primary-soft)' }}>
                  A→Z
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-fg-on-dark)' }}>
                  {productie.title}
                </h3>
                <p className="mt-2 text-[14px]" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                  {productie.lead}
                </p>
              </div>
            </Link>
          </RevealItem>
        </StaggerReveal>

        <div className="mt-10 flex justify-end">
          <Link
            href="/aanbod"
            className="inline-flex items-center gap-2 group"
            style={{ color: 'var(--color-fg)' }}
          >
            <span>{home.services.ctaLabel}</span>
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
