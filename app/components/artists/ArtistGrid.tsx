import Image from 'next/image'
import { artists } from '../../lib/content/artists'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ArtistGrid() {
  return (
    <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {artists.map((a, i) => (
        <RevealItem key={a.slug}>
          <a
            href={a.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative"
          >
            {/* Portrait card — tilted on hover */}
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] transition-transform duration-500"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                transitionTimingFunction: 'var(--ease-out-quart)',
                transform: i % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)',
              }}
            >
              {a.photo && (
                <Image
                  src={a.photo}
                  alt={a.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                />
              )}

              {/* Index number corner */}
              <span
                className="absolute top-4 left-4 mono px-2 py-1 rounded-[var(--radius-sm)]"
                style={{
                  color: 'var(--color-fg)',
                  backgroundColor: 'color-mix(in oklch, var(--color-bg) 85%, transparent)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Hover arrow */}
              <span
                aria-hidden
                className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-fg-on-dark)',
                  transitionTimingFunction: 'var(--ease-out-quart)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M7 17L17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </span>
            </div>

            {/* Name + blurb below */}
            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3
                  style={{
                    fontSize: '1.625rem',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    color: 'var(--color-fg)',
                  }}
                >
                  {a.name}
                </h3>
                <p
                  className="mt-2 leading-snug"
                  style={{ fontSize: '14px', color: 'var(--color-fg-secondary)' }}
                >
                  {a.blurb}
                </p>
              </div>
              <span
                className="mono shrink-0 pt-1.5"
                style={{ color: 'var(--color-primary)' }}
              >
                ↗ boeken
              </span>
            </div>
          </a>
        </RevealItem>
      ))}
    </StaggerReveal>
  )
}
