import Image from 'next/image'
import Link from 'next/link'
import { artists } from '../../lib/content/artists'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ArtistsTeaser() {
  const featured = artists.slice(0, 4)

  return (
    <section
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="container-inset">
        <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
              Artiesten
            </p>
            <h2 className="max-w-[14ch]" style={{ fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 5rem)' }}>
              Wij boeken, wij kennen ze.
            </h2>
          </div>
          <p className="max-w-[42ch] text-[17px]" style={{ color: 'var(--color-fg-secondary)' }}>
            Wij draaien al jaren tapes voor Nederlandse zangers. Kies een artiest, wij regelen de techniek eromheen.
          </p>
        </div>

        <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {featured.map((a, i) => (
            <RevealItem key={a.slug}>
              <a
                href={a.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div
                  className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)]"
                  style={{ backgroundColor: 'var(--color-surface-2)' }}
                >
                  {a.photo && (
                    <Image
                      src={a.photo}
                      alt={a.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                    />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3
                    className="truncate"
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: 'var(--color-fg)',
                    }}
                  >
                    {a.name}
                  </h3>
                  <span style={{ color: 'var(--color-primary)', fontSize: '14px' }} aria-hidden>↗</span>
                </div>
              </a>
            </RevealItem>
          ))}
        </StaggerReveal>

        <div className="mt-10 flex items-center justify-between gap-4">
          <Link
            href="/artiesten"
            className="group inline-flex items-center gap-2 text-[15px]"
            style={{ color: 'var(--color-fg)', fontWeight: 500 }}
          >
            <span className="underline-offset-4 group-hover:underline">Alle 8 artiesten</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <p className="hidden md:block" style={{ color: 'var(--color-fg-muted)', fontSize: '13px' }}>
            {artists.slice(4).map((a) => a.name).join(' · ')}
          </p>
        </div>
      </div>
    </section>
  )
}
