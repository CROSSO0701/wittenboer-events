import { home } from '../../lib/content/home'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ApproachStrip() {
  const { approach } = home
  return (
    <section className="py-24 md:py-32">
      <div className="container-inset">
        <div className="mb-14 max-w-3xl">
          <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
            {approach.label}
          </p>
          <h2>{approach.heading}</h2>
        </div>

        <StaggerReveal className="grid md:grid-cols-3">
          {approach.steps.map((s, i) => (
            <RevealItem
              key={s.number}
              className={`py-8 md:py-10 md:px-8 md:first:pl-0 md:last:pr-0 ${
                i > 0 ? 'md:border-l' : ''
              }`}
            >
              <div
                style={
                  i > 0
                    ? { borderTop: '0.5px solid var(--color-border)' }
                    : undefined
                }
                className="md:border-0 md:pt-0 pt-8"
              >
                <div className="flex items-baseline justify-between mb-5">
                  <span className="mono" style={{ color: 'var(--color-primary)' }}>
                    {s.number}
                  </span>
                  <span className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                    {String(i + 1).padStart(2, '0')} · {approach.steps.length}
                  </span>
                </div>
                <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {s.title}
                </h3>
                <p className="mt-3" style={{ color: 'var(--color-fg-secondary)' }}>
                  {s.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </StaggerReveal>
      </div>

      <style>{`
        @media (min-width: 768px) {
          section .md\\:border-l {
            border-left: 0.5px solid var(--color-border);
          }
        }
      `}</style>
    </section>
  )
}
