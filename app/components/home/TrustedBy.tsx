import { home } from '../../lib/content/home'

export function TrustedBy() {
  const { names, label } = home.trustedBy
  const items = [...names, ...names]
  return (
    <section
      className="py-12 md:py-14 border-y"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-1)' }}
    >
      <div className="container-inset mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="h-0.5 w-8 rounded-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <p style={{ color: 'var(--color-fg-secondary)', fontSize: '14px', fontWeight: 500 }}>
          {label}
        </p>
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track">
          {items.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="flex items-center gap-[var(--space-3xl)] whitespace-nowrap uppercase"
              style={{
                color: 'var(--color-fg)',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 1.5rem + 2vw, 3.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.005em',
              }}
            >
              <span>{n}</span>
              <span
                aria-hidden
                style={{ color: 'var(--color-primary)', fontSize: '0.5em' }}
              >
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
