import { home } from '../../lib/content/home'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ApproachStrip() {
  const { approach } = home
  return (
    <section
      className="py-24 md:py-36 relative"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="container-inset">
        <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              {approach.label}
            </p>
            <h2 className="max-w-[18ch]">{approach.heading}</h2>
          </div>
          <p className="max-w-[40ch] mono" style={{ color: 'var(--color-fg-secondary)' }}>
            Draaiboek · Ontwerp · Uitvoering → Eén aanspreekpunt, drie duidelijke fases.
          </p>
        </div>

        {/* Staggered columns with different heights + connecting line */}
        <StaggerReveal className="relative grid md:grid-cols-3 gap-8 md:gap-0">
          {/* Horizontal connector line — desktop */}
          <div
            aria-hidden
            className="hidden md:block absolute top-[72px] left-0 right-0 h-px z-0"
            style={{ background: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-primary) 50%, var(--color-border) 100%)' }}
          />

          {approach.steps.map((s, i) => (
            <RevealItem
              key={s.number}
              className="relative z-10"
            >
              <div
                className={`relative px-0 md:px-8 md:first:pl-0 md:last:pr-0 ${
                  i === 1 ? 'md:translate-y-10' : i === 2 ? 'md:translate-y-20' : ''
                }`}
              >
                {/* Dot on connector */}
                <div className="hidden md:flex items-center gap-4 mb-6 relative">
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      boxShadow: '0 0 0 6px var(--color-bg), 0 0 0 7px var(--color-primary)',
                    }}
                  />
                  <span
                    className="mono"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {s.number} · Fase
                  </span>
                </div>

                {/* Mobile dot */}
                <div className="flex md:hidden items-center gap-3 mb-5">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  <span className="mono" style={{ color: 'var(--color-primary)' }}>
                    {s.number} · Fase
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 'clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: 'var(--color-fg)',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-4"
                  style={{
                    color: 'var(--color-fg-secondary)',
                    maxInlineSize: '30ch',
                  }}
                >
                  {s.body}
                </p>

                {/* Micro-duration badge */}
                <span
                  className="mono inline-block mt-5 px-2.5 py-1 rounded-[var(--radius-sm)]"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-fg-secondary)',
                  }}
                >
                  {i === 0 ? '≤ 2 werkdagen' : i === 1 ? '1–3 weken' : 'Event-dag'}
                </span>
              </div>
            </RevealItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}
