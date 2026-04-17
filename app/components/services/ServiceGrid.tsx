import Image from 'next/image'
import Link from 'next/link'
import { services } from '../../lib/content/services'
import { StaggerReveal, RevealItem } from '../shared/StaggerReveal'

export function ServiceGrid() {
  return (
    <StaggerReveal className="grid gap-4 md:grid-cols-6 md:auto-rows-[minmax(220px,auto)]">
      {services.map((s, i) => {
        const span = i === 0 ? 'md:col-span-4' : i === 1 ? 'md:col-span-2' : i === 2 ? 'md:col-span-3' : i === 3 ? 'md:col-span-3' : 'md:col-span-3'
        return (
          <RevealItem key={s.slug} className={span}>
            <Link
              href={`/aanbod/${s.slug}`}
              className="group relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] border transition-colors hover:[background-color:var(--color-surface-1)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {s.image && i < 2 && (
                <>
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent 30%, color-mix(in oklch, var(--color-surface-dark) 80%, transparent))',
                    }}
                  />
                </>
              )}
              <div
                className="relative z-10 flex h-full flex-col justify-between p-7 md:p-9"
                style={{ color: i < 2 ? 'var(--color-fg-on-dark)' : 'var(--color-fg)' }}
              >
                <p className="mono" style={{ color: i < 2 ? 'var(--color-fg-on-dark-muted)' : 'var(--color-fg-muted)' }}>
                  {String(i + 1).padStart(2, '0')} · Dienst
                </p>
                <div>
                  <h3
                    style={{
                      fontSize: 'var(--text-display-sm)',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: i < 2 ? 'var(--color-fg-on-dark)' : 'var(--color-fg)',
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="mt-2 max-w-[42ch]"
                    style={{ color: i < 2 ? 'var(--color-fg-on-dark-muted)' : 'var(--color-fg-secondary)' }}
                  >
                    {s.lead}
                  </p>
                </div>
              </div>
            </Link>
          </RevealItem>
        )
      })}
    </StaggerReveal>
  )
}
