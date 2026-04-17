import { home } from '../../lib/content/home'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ApproachStrip() {
  const { approach } = home
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--color-surface-1)' }}>
      <div className="container-inset">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
              {approach.label}
            </p>
            <h2 className="max-w-[16ch]" style={{ fontSize: 'clamp(2.25rem, 1.4rem + 3.5vw, 4.5rem)' }}>
              {approach.heading}
            </h2>
          </div>
        </div>

        {/* Flat 3-col, aligned baseline, connector line */}
        <div className="relative">
          <div
            aria-hidden
            className="hidden md:block absolute top-[38px] left-8 right-8 h-0.5 z-0 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-border-strong) 0%, var(--color-tertiary-deep) 50%, var(--color-border-strong) 100%)',
            }}
          />

          <StaggerReveal className="relative grid md:grid-cols-3 gap-10 md:gap-6 z-10">
            {approach.steps.map((s) => (
              <RevealItem key={s.number}>
                <div className="relative md:px-6">
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      aria-hidden
                      className="inline-flex h-[76px] w-[76px] items-center justify-center rounded-full shrink-0"
                      style={{
                        backgroundColor: 'var(--color-tertiary)',
                        color: 'var(--color-fg)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 400,
                        fontSize: '30px',
                        letterSpacing: '0.01em',
                        boxShadow: '0 0 0 6px var(--color-surface-1)',
                      }}
                    >
                      {s.number}
                    </span>
                  </div>

                  <h3
                    className="uppercase"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 400,
                      fontSize: 'clamp(2rem, 1.4rem + 2vw, 3.25rem)',
                      letterSpacing: '-0.005em',
                      lineHeight: 0.95,
                      color: 'var(--color-fg)',
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="mt-3 text-[16px]"
                    style={{
                      color: 'var(--color-fg-secondary)',
                      maxInlineSize: '32ch',
                      lineHeight: 1.55,
                    }}
                  >
                    {s.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </StaggerReveal>
        </div>
      </div>
    </section>
  )
}
