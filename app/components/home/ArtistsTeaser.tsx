import Image from 'next/image'
import Link from 'next/link'
import { artists } from '../../lib/content/artists'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ArtistsTeaser() {
  // Show 4 featured artists as a teaser, rest as ticker
  const featured = artists.slice(0, 4)
  const allNames = artists.map((a) => a.name).join(' · ')

  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-1)' }}
    >
      <div className="container-inset">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              Artiesten · 08 boekbaar
            </p>
            <h2 className="max-w-[18ch]">
              Een netwerk van artiesten, <span style={{ color: 'var(--color-primary)', fontStyle: 'italic', fontWeight: 400 }}>vast geboekt</span>.
            </h2>
          </div>
          <p className="max-w-[42ch]" style={{ color: 'var(--color-fg-secondary)' }}>
            Wij draaien al jaren tapes voor Nederlandse zangers. Wij kennen hun repertoires, hun wissels, hun techniek.
          </p>
        </div>

        <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {featured.map((a, i) => (
            <RevealItem key={a.slug}>
              <a
                href={a.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-surface-2)' }}
              >
                {a.photo && (
                  <Image
                    src={a.photo}
                    alt={a.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 40%, color-mix(in oklch, var(--color-surface-dark) 90%, transparent))',
                  }}
                />
                <div className="relative z-10 flex h-full flex-col justify-end p-4" style={{ color: 'var(--color-fg-on-dark)' }}>
                  <span className="mono" style={{ color: 'var(--color-primary-soft)' }}>
                    0{i + 1}
                  </span>
                  <h3
                    className="mt-1"
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.05,
                      color: 'var(--color-fg-on-dark)',
                    }}
                  >
                    {a.name}
                  </h3>
                </div>
              </a>
            </RevealItem>
          ))}
        </StaggerReveal>

        <div className="mt-8 md:mt-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <Link
            href="/artiesten"
            className="group inline-flex items-center gap-2 self-start shrink-0"
            style={{ color: 'var(--color-fg)' }}
          >
            <span className="underline-offset-4 group-hover:underline">Alle artiesten bekijken</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <p
            className="mono truncate min-w-0"
            style={{ color: 'var(--color-fg-muted)' }}
            title={allNames}
          >
            + {allNames}
          </p>
        </div>
      </div>
    </section>
  )
}
