const BRANDS = [
  'L-Acoustics',
  'd&b audiotechnik',
  'RCF',
  'grandMA',
  'High End Systems Hog',
  'Robe Lighting',
  'Martin Audio',
  'Shure',
  'Sennheiser',
  'DiGiCo',
  'Allen & Heath',
  'Chauvet Professional',
]

export function EquipmentStrip() {
  const items = [...BRANDS, ...BRANDS]
  return (
    <section
      className="py-14 md:py-16"
      style={{
        backgroundColor: 'var(--color-surface-dark)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset mb-6 flex items-center gap-3">
        <span
          aria-hidden
          className="h-px w-8"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
          A-merk gear · Rental inventory
        </p>
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track" style={{ animationDirection: 'reverse', animationDuration: '55s' }}>
          {items.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="flex items-center gap-[var(--space-3xl)] whitespace-nowrap"
              style={{
                color: 'var(--color-fg-on-dark)',
                fontSize: 'clamp(1.5rem, 1.2rem + 1.6vw, 2.75rem)',
                fontWeight: 500,
                letterSpacing: '-0.03em',
                fontStyle: i % 4 === 3 ? 'italic' : 'normal',
              }}
            >
              <span>{n}</span>
              <span
                aria-hidden
                style={{
                  color: 'var(--color-primary)',
                  fontSize: '0.7em',
                }}
              >
                ◇
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
