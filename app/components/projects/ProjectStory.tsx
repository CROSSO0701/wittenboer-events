import Image from 'next/image'
import type { Project } from '../../lib/content/projects'

type Props = {
  project: Project
  reverse?: boolean
}

export function ProjectStory({ project, reverse = false }: Props) {
  return (
    <article
      id={project.slug}
      className="py-16 md:py-24 border-t scroll-mt-28"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="container-inset grid gap-10 md:grid-cols-2 md:gap-16 items-start">
        <div className={`${reverse ? 'md:order-2' : ''} md:sticky md:top-28`}>
          <p
            className="mb-3"
            style={{
              color: 'var(--color-tertiary-deep)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {project.location} · {project.year}
          </p>
          <h2
            className="mb-8 max-w-[14ch] uppercase"
            style={{ fontSize: 'clamp(2.25rem, 1.4rem + 3vw, 4rem)' }}
          >
            {project.title}
          </h2>

          <div
            className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]"
            style={{ backgroundColor: 'var(--color-surface-2)' }}
          >
            <Image
              src={project.photo}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>

          {project.partners && project.partners.length > 0 && (
            <div className="mt-6">
              <p
                className="mb-2"
                style={{
                  color: 'var(--color-fg-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Partners
              </p>
              <ul className="flex flex-wrap gap-2">
                {project.partners.map((p) => (
                  <li
                    key={p}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-[13px]"
                    style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-fg-secondary)' }}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={`${reverse ? 'md:order-1' : ''} flex flex-col gap-10`}>
          <p
            className="text-[17px] md:text-[19px]"
            style={{ color: 'var(--color-fg-secondary)', maxInlineSize: '52ch', lineHeight: 1.6 }}
          >
            {project.description}
          </p>

          <div>
            <p
              className="mb-4"
              style={{
                color: 'var(--color-fg-muted)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Scope
            </p>
            <ul className="flex flex-col gap-0">
              {project.scope.map((s) => (
                <li
                  key={s}
                  className="py-3 flex gap-3"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span
                    aria-hidden
                    className="mt-[9px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--color-tertiary-deep)' }}
                  />
                  <span style={{ color: 'var(--color-fg)', fontSize: '15.5px' }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure
            className="pl-5 py-2"
            style={{ borderLeft: '2px solid var(--color-tertiary-deep)' }}
          >
            <blockquote
              className="text-[17px] md:text-[18px]"
              style={{ color: 'var(--color-fg)', lineHeight: 1.5 }}
            >
              &ldquo;{project.testimonial.quote}&rdquo;
            </blockquote>
            <figcaption
              className="mt-4"
              style={{ color: 'var(--color-fg-muted)', fontSize: '13px', fontWeight: 500 }}
            >
              {project.testimonial.author}, {project.testimonial.role}
            </figcaption>
          </figure>
        </div>
      </div>
    </article>
  )
}
