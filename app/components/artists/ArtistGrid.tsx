import Image from 'next/image'
import { artists } from '../../lib/content/artists'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ArtistGrid() {
  // Editorial rhythm: wide, narrow, narrow, wide, narrow, wide, narrow, narrow
  const spanClass = [
    'md:col-span-7',
    'md:col-span-5',
    'md:col-span-5',
    'md:col-span-7',
    'md:col-span-5',
    'md:col-span-7',
    'md:col-span-5',
    'md:col-span-5',
  ]

  return (
    <StaggerReveal className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5">
      {artists.map((a, i) => {
        const cls = spanClass[i % spanClass.length]
        const featured = cls.includes('span-7')

        return (
          <RevealItem key={a.slug} className={cls}>
            <a
              href={a.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block relative overflow-hidden rounded-[var(--radius-xl)] ${
                featured ? 'aspect-[16/11]' : 'aspect-[4/5]'
              }`}
              style={{ backgroundColor: 'var(--color-surface-2)' }}
            >
              {a.photo && (
                <Image
                  src={a.photo}
                  alt={a.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                />
              )}

              {/* Teal duotone tint */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(200deg, color-mix(in oklch, var(--color-primary) 55%, transparent), transparent 60%)',
                  opacity: 0.35,
                }}
              />

              {/* Bottom darkening */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 35%, color-mix(in oklch, var(--color-surface-dark) 92%, transparent))',
                }}
              />

              {/* Index number */}
              <span
                className="absolute top-4 left-5 md:top-5 md:left-6 mono z-10"
                style={{ color: 'var(--color-primary-soft)' }}
              >
                {String(i + 1).padStart(2, '0')} / {String(artists.length).padStart(2, '0')}
              </span>

              {/* Arrow */}
              <span
                aria-hidden
                className="absolute top-4 right-5 md:top-5 md:right-6 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45"
                style={{
                  border: '0.5px solid color-mix(in oklch, var(--color-fg-on-dark) 30%, transparent)',
                  color: 'var(--color-fg-on-dark)',
                  transitionTimingFunction: 'var(--ease-out-quart)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M7 17L17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </span>

              <div
                className="relative z-10 flex h-full flex-col justify-end p-5 md:p-7"
                style={{ color: 'var(--color-fg-on-dark)' }}
              >
                <h3
                  style={{
                    fontSize: featured
                      ? 'clamp(1.75rem, 1.3rem + 1.6vw, 2.75rem)'
                      : 'clamp(1.375rem, 1.1rem + 0.8vw, 1.875rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-fg-on-dark)',
                    lineHeight: 1,
                  }}
                >
                  {a.name}
                </h3>
                <p
                  className={`mt-3 leading-snug ${featured ? 'max-w-[48ch]' : 'max-w-[36ch]'}`}
                  style={{
                    fontSize: featured ? '15px' : '13.5px',
                    color: 'var(--color-fg-on-dark-muted)',
                  }}
                >
                  {a.blurb}
                </p>
              </div>
            </a>
          </RevealItem>
        )
      })}
    </StaggerReveal>
  )
}
