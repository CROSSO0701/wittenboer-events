import Image from 'next/image'
import Link from 'next/link'
import { services } from '../../lib/content/services'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ServiceGrid() {
  // 6-col rhythm: 4+2 / 3+3 / 4+2
  const spans = [
    'md:col-span-4',
    'md:col-span-2',
    'md:col-span-3',
    'md:col-span-3',
    'md:col-span-4',
    'md:col-span-2',
  ]

  return (
    <StaggerReveal className="grid gap-4 md:grid-cols-6 md:auto-rows-[minmax(240px,auto)]">
      {services.map((s, i) => {
        const hasHeroImage = i < 2 && !!s.image
        const isLight = !hasHeroImage
        return (
          <RevealItem key={s.slug} className={spans[i] || 'md:col-span-3'}>
            <Link
              href={`/aanbod/${s.slug}`}
              className="group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] transition-all duration-500 hover:-translate-y-1"
              style={{
                border: isLight ? '1px solid var(--color-border)' : 'none',
                backgroundColor: isLight ? 'var(--color-bg)' : 'var(--color-surface-dark)',
                transitionTimingFunction: 'var(--ease-out-quart)',
              }}
            >
              {hasHeroImage && (
                <>
                  <Image
                    src={s.image!}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent 20%, color-mix(in oklch, var(--color-surface-dark) 88%, transparent))',
                    }}
                  />
                </>
              )}
              <div
                className="relative z-10 flex h-full flex-col justify-between p-7 md:p-9"
                style={{ color: hasHeroImage ? 'var(--color-fg-on-dark)' : 'var(--color-fg)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    style={{
                      color: hasHeroImage ? 'var(--color-tertiary)' : 'var(--color-tertiary-deep)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')} · Dienst
                  </p>
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 group-hover:rotate-45 shrink-0"
                    style={{
                      border: hasHeroImage
                        ? '1px solid color-mix(in oklch, var(--color-tertiary) 50%, transparent)'
                        : '1px solid var(--color-border-strong)',
                      color: hasHeroImage ? 'var(--color-fg-on-dark)' : 'var(--color-fg)',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M7 17L17 7" />
                      <path d="M8 7h9v9" />
                    </svg>
                  </span>
                </div>

                <div>
                  <h3
                    className="uppercase"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 400,
                      fontSize: 'clamp(1.75rem, 1.2rem + 1.5vw, 2.75rem)',
                      letterSpacing: '0.01em',
                      lineHeight: 0.95,
                      color: hasHeroImage ? 'var(--color-fg-on-dark)' : 'var(--color-fg)',
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="mt-3 max-w-[42ch]"
                    style={{
                      fontSize: '15px',
                      color: hasHeroImage ? 'var(--color-fg-on-dark-muted)' : 'var(--color-fg-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {s.lead}
                  </p>
                </div>
              </div>
            </Link>
          </RevealItem>
        )
      })}
    </StaggerReveal>
  )
}
