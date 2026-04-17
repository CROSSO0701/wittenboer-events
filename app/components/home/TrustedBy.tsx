import { home } from '../../lib/content/home'

export function TrustedBy() {
  const { names, label } = home.trustedBy
  const items = [...names, ...names]
  return (
    <section
      className="py-16 border-y"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-1)' }}
    >
      <div className="container-inset mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="h-px flex-1 max-w-12"
          style={{ backgroundColor: 'var(--color-border-strong)' }}
        />
        <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
          {label}
        </p>
        <span
          aria-hidden
          className="h-px flex-1"
          style={{ backgroundColor: 'var(--color-border-strong)' }}
        />
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track">
          {items.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="flex items-center gap-[var(--space-3xl)] whitespace-nowrap"
              style={{
                color: 'var(--color-fg-secondary)',
                fontSize: 'clamp(1.5rem, 1.2rem + 1.6vw, 2.5rem)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              <span>{n}</span>
              <span aria-hidden style={{ color: 'var(--color-primary)' }}>
                ·
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
