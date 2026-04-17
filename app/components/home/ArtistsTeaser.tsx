import Image from 'next/image'
import Link from 'next/link'
import { artists } from '../../lib/content/artists'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ArtistsTeaser() {
  const featured = artists.slice(0, 4)

  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-1)' }}
    >
      <div className="container-inset">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mono mb-3" style={{ color: 'var(--color-primary)' }}>
              Artiesten · 08 boekbaar
            </p>
            <h2 className="max-w-[16ch]">
              Wij kennen hun{' '}
              <span style={{ color: 'var(--color-primary)', fontStyle: 'italic', fontWeight: 400 }}>
                repertoire.
              </span>
            </h2>
          </div>
          <p className="max-w-[42ch]" style={{ color: 'var(--color-fg-secondary)' }}>
            Wij draaien al jaren tapes voor Nederlandse zangers. Kies een artiest — we regelen de techniek eromheen.
          </p>
        </div>

        <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {featured.map((a, i) => (
            <RevealItem key={a.slug}>
              <a
                href={a.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block relative"
              >
                <div
                  className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)]"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    transform: i % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)',
                  }}
                >
                  {a.photo && (
                    <Image
                      src={a.photo}
                      alt={a.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                    />
                  )}
                  <span
                    className="absolute top-3 left-3 mono px-2 py-0.5 rounded-[var(--radius-sm)]"
                    style={{
                      color: 'var(--color-fg)',
                      backgroundColor: 'color-mix(in oklch, var(--color-bg) 85%, transparent)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    0{i + 1}
                  </span>
                </div>
                <div className="mt-3">
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      color: 'var(--color-fg)',
                    }}
                  >
                    {a.name}
                  </h3>
                </div>
              </a>
            </RevealItem>
          ))}
        </StaggerReveal>

        <div className="mt-10 flex items-center justify-between">
          <Link
            href="/artiesten"
            className="group inline-flex items-center gap-2"
            style={{ color: 'var(--color-fg)' }}
          >
            <span className="underline-offset-4 group-hover:underline">Alle 8 artiesten bekijken</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
            + {artists.slice(4).map((a) => a.name).join(' · ')}
          </p>
        </div>
      </div>
    </section>
  )
}
