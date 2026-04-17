import Image from 'next/image'
import Link from 'next/link'
import { home } from '../../lib/content/home'
import { services } from '../../lib/content/services'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ServicesPreview() {
  return (
    <section id="diensten" className="py-20 md:py-28 relative" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container-inset">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
              {home.services.label}
            </p>
            <h2 className="max-w-[14ch]" style={{ fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 5rem)' }}>
              {home.services.heading}
            </h2>
          </div>
          <p className="max-w-[44ch] text-[17px]" style={{ color: 'var(--color-fg-secondary)' }}>
            {home.services.lead}
          </p>
        </div>

        <StaggerReveal className="grid gap-4 md:grid-cols-12 md:auto-rows-[minmax(200px,auto)]">
          {services.map((s, i) => {
            const spans = [
              'md:col-span-7 md:row-span-2',   // Geluid — hero
              'md:col-span-5',                  // Licht
              'md:col-span-5',                  // Tapeshows
              'md:col-span-4',                  // Stroom
              'md:col-span-4',                  // Artiesten
              'md:col-span-4',                  // Productie
            ]
            const isHero = i === 0
            const hasImage = !!s.image

            return (
              <RevealItem key={s.slug} className={spans[i] || 'md:col-span-4'}>
                <Link
                  href={`/aanbod/${s.slug}`}
                  className={`group relative block h-full overflow-hidden rounded-[var(--radius-xl)] transition-all duration-500 hover:-translate-y-1 ${
                    isHero ? 'min-h-[420px]' : 'min-h-[200px]'
                  }`}
                  style={{
                    backgroundColor: hasImage
                      ? 'var(--color-surface-dark)'
                      : 'var(--color-surface-1)',
                    border: hasImage ? 'none' : '1px solid var(--color-border)',
                    transitionTimingFunction: 'var(--ease-out-quart)',
                  }}
                >
                  {hasImage && (
                    <>
                      <Image
                        src={s.image!}
                        alt={s.title}
                        fill
                        sizes={isHero ? '(max-width: 768px) 100vw, 55vw' : '(max-width: 768px) 100vw, 40vw'}
                        className="object-cover opacity-85 transition-transform duration-[900ms] group-hover:scale-[1.05]"
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
                    className={`relative z-10 flex h-full flex-col ${
                      isHero ? 'justify-end p-7 md:p-9' : 'justify-between p-6'
                    }`}
                    style={{
                      color: hasImage ? 'var(--color-fg-on-dark)' : 'var(--color-fg)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="uppercase"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 400,
                          fontSize: isHero ? 'clamp(2.5rem, 2rem + 2vw, 4.5rem)' : 'clamp(1.5rem, 1.2rem + 1vw, 2.25rem)',
                          letterSpacing: isHero ? '-0.005em' : '0em',
                          lineHeight: 0.95,
                          color: hasImage ? 'var(--color-fg-on-dark)' : 'var(--color-fg)',
                          marginTop: isHero ? 'auto' : 0,
                        }}
                      >
                        {s.title}
                      </h3>
                      {!isHero && (
                        <span
                          aria-hidden
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45 shrink-0"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-fg-on-dark)',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M7 17L17 7" />
                            <path d="M8 7h9v9" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p
                      className={isHero ? 'mt-4 max-w-[46ch]' : 'mt-2'}
                      style={{
                        fontSize: isHero ? '16px' : '14px',
                        color: hasImage ? 'var(--color-fg-on-dark-muted)' : 'var(--color-fg-secondary)',
                        lineHeight: 1.55,
                      }}
                    >
                      {s.lead}
                    </p>
                  </div>
                </Link>
              </RevealItem>
            )
          })}
        </StaggerReveal>
      </div>
    </section>
  )
}
