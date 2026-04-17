import Image from 'next/image'
import Link from 'next/link'
import { services, type Service } from '../../lib/content/services'

type Props = {
  service: Service
}

export function ServiceDetail({ service }: Props) {
  const related = services.filter((s) => s.slug !== service.slug)

  return (
    <>
      <section className="pt-24 md:pt-32 pb-16">
        <div className="container-inset">
          <Link
            href="/aanbod"
            className="group inline-flex items-center gap-2 mono mb-10 transition-colors"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-transform group-hover:-translate-x-1">
              <path d="M19 12H5" />
              <path d="M11 6l-6 6 6 6" />
            </svg>
            Terug naar aanbod
          </Link>

          <div className="grid gap-12 md:grid-cols-[1.3fr_1fr] md:items-start mb-16">
            <div>
              <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
                Dienst
              </p>
              <h1 className="mb-6">{service.title}</h1>
              <p className="text-[var(--text-lg)]" style={{ color: 'var(--color-fg-secondary)' }}>
                {service.lead}
              </p>
            </div>
          </div>

          {service.image && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)] mb-14" style={{ backgroundColor: 'var(--color-surface-2)' }}>
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start">
            <p className="text-[17px]" style={{ color: 'var(--color-fg-secondary)', maxInlineSize: 'var(--measure-body)' }}>
              {service.body}
            </p>

            {service.bullets && (
              <ul className="flex flex-col gap-3">
                {service.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-3 py-3"
                    style={{ borderBottom: '0.5px solid var(--color-border)' }}
                  >
                    <span
                      aria-hidden
                      className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                    <span style={{ color: 'var(--color-fg)' }}>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-inset">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="inline-block h-px w-8" style={{ backgroundColor: 'var(--color-primary)' }} />
            <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
              Andere diensten
            </p>
          </div>

          <ul className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-0 md:px-0" style={{ scrollbarWidth: 'thin' }}>
            {related.map((r) => (
              <li key={r.slug} className="shrink-0">
                <Link
                  href={`/aanbod/${r.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] transition-colors hover:[background-color:var(--color-surface-1)]"
                  style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-fg)' }}
                >
                  {r.title}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
