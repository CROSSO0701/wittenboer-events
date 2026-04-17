import { home } from '../../lib/content/home'

export function TrustedBy() {
  const { names, label } = home.trustedBy
  const items = [...names, ...names]
  return (
    <section
      className="py-14 md:py-16 border-y relative"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-1)' }}
    >
      <div className="container-inset mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="h-px w-8"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
          {label} · Selectie klanten
        </p>
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track">
          {items.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="flex items-center gap-[var(--space-3xl)] whitespace-nowrap"
              style={{
                color: 'var(--color-fg)',
                fontSize: 'clamp(1.75rem, 1.4rem + 2vw, 3.25rem)',
                fontWeight: 500,
                letterSpacing: '-0.03em',
                fontStyle: i % 3 === 1 ? 'italic' : 'normal',
              }}
            >
              <span>{n}</span>
              <span aria-hidden style={{ color: 'var(--color-primary)', fontSize: '0.6em' }}>
                ●
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
