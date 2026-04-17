import Image from 'next/image'
import Link from 'next/link'
import { home } from '../../lib/content/home'
import { services } from '../../lib/content/services'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ServicesPreview() {
  const featured = [
    services.find((s) => s.slug === 'geluid')!,
    services.find((s) => s.slug === 'licht')!,
    services.find((s) => s.slug === 'artiestenbegeleiding')!,
  ]
  const remaining = services.filter((s) => !featured.includes(s)).length

  return (
    <section id="diensten" className="py-24 md:py-32">
      <div className="container-inset">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              {home.services.label}
            </p>
            <h2 className="max-w-[18ch]">{home.services.heading}</h2>
          </div>
          <p className="max-w-[46ch]" style={{ color: 'var(--color-fg-secondary)' }}>
            {home.services.lead}
          </p>
        </div>

        <StaggerReveal className="grid gap-4 md:grid-cols-6 md:grid-rows-2 md:auto-rows-fr">
          {/* Cell 1 — large feature (Geluid) */}
          <RevealItem className="md:col-span-4 md:row-span-2">
            <Link
              href={`/aanbod/${featured[0].slug}`}
              className="group relative block h-full min-h-[420px] overflow-hidden rounded-[var(--radius-xl)] border transition-colors"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-1)' }}
            >
              {featured[0].image && (
                <Image
                  src={featured[0].image}
                  alt={featured[0].title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                  style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 30%, color-mix(in oklch, var(--color-surface-dark) 80%, transparent))',
                }}
              />
              <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-10" style={{ color: 'var(--color-fg-on-dark)' }}>
                <p className="mono mb-3" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                  01 · Dienst
                </p>
                <h3 style={{ color: 'var(--color-fg-on-dark)', fontWeight: 600 }}>{featured[0].title}</h3>
                <p className="mt-3 max-w-[40ch]" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                  {featured[0].lead}
                </p>
              </div>
            </Link>
          </RevealItem>

          {/* Cell 2 — Licht */}
          <RevealItem className="md:col-span-2">
            <Link
              href={`/aanbod/${featured[1].slug}`}
              className="group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] border p-6 transition-colors hover:[background-color:var(--color-surface-1)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                02 · Dienst
              </p>
              <div>
                <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600 }}>{featured[1].title}</h3>
                <p className="mt-2 text-[15px]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {featured[1].lead}
                </p>
              </div>
            </Link>
          </RevealItem>

          {/* Cell 3 — Artiestenbegeleiding */}
          <RevealItem className="md:col-span-2">
            <Link
              href={`/aanbod/${featured[2].slug}`}
              className="group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 transition-colors"
              style={{
                backgroundColor: 'var(--color-primary-soft)',
                border: '0.5px solid color-mix(in oklch, var(--color-primary) 25%, transparent)',
              }}
            >
              <p className="mono" style={{ color: 'var(--color-primary-deep)' }}>
                03 · Dienst
              </p>
              <div>
                <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600, color: 'var(--color-primary-deep)' }}>
                  {featured[2].title}
                </h3>
                <p className="mt-2 text-[15px]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {featured[2].lead}
                </p>
              </div>
            </Link>
          </RevealItem>
        </StaggerReveal>

        <div className="mt-8 flex justify-end">
          <Link
            href="/aanbod"
            className="inline-flex items-center gap-2 group"
            style={{ color: 'var(--color-fg)' }}
          >
            <span className="mono" style={{ color: 'var(--color-fg-muted)' }}>
              + {remaining} meer diensten
            </span>
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
