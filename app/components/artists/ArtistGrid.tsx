import Image from 'next/image'
import { artists } from '../../lib/content/artists'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ArtistGrid() {
  return (
    <StaggerReveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {artists.map((a, i) => {
        const featured = i === 0 || i === 5
        return (
          <RevealItem key={a.slug} className={featured ? 'col-span-2 row-span-1' : ''}>
            <a
              href={a.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative aspect-[3/4] overflow-hidden rounded-[var(--radius-xl)]"
              style={{ backgroundColor: 'var(--color-surface-2)' }}
            >
              {a.photo && (
                <Image
                  src={a.photo}
                  alt={a.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 40%, color-mix(in oklch, var(--color-surface-dark) 85%, transparent))',
                }}
              />

              <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-6" style={{ color: 'var(--color-fg-on-dark)' }}>
                <div className="flex items-start justify-between gap-3">
                  <h3
                    style={{
                      fontSize: featured ? 'var(--text-display-sm)' : '1.25rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-fg-on-dark)',
                      lineHeight: 1.1,
                    }}
                  >
                    {a.name}
                  </h3>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    className="shrink-0 translate-y-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0"
                    style={{ color: 'var(--color-primary-soft)', transitionTimingFunction: 'var(--ease-out-quart)' }}
                  >
                    <path d="M7 17L17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </div>
                <p
                  className="mt-2 text-[13px] leading-snug"
                  style={{ color: 'var(--color-fg-on-dark-muted)' }}
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
