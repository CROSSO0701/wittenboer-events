import Image from 'next/image'
import type { Project } from '../../lib/content/projects'

type Props = {
  project: Project
  reverse?: boolean
}

export function ProjectStory({ project, reverse = false }: Props) {
  return (
    <article
      className="py-16 md:py-24 border-t"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="container-inset grid gap-10 md:grid-cols-2 md:gap-16 items-start">
        <div className={`${reverse ? 'md:order-2' : ''} md:sticky md:top-24`}>
          <p className="mono mb-3" style={{ color: 'var(--color-primary)' }}>
            {project.location} · {project.year}
          </p>
          <h2 className="mb-6 max-w-[16ch]">{project.title}</h2>

          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]" style={{ backgroundColor: 'var(--color-surface-2)' }}>
            <Image
              src={project.photo}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>

          {project.partners && project.partners.length > 0 && (
            <div className="mt-5">
              <p className="mono mb-2" style={{ color: 'var(--color-fg-muted)' }}>
                Partners
              </p>
              <ul className="flex flex-wrap gap-2">
                {project.partners.map((p) => (
                  <li
                    key={p}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-[13px]"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-fg-secondary)' }}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={`${reverse ? 'md:order-1' : ''} flex flex-col gap-8`}>
          <p className="text-[var(--text-lg)]" style={{ color: 'var(--color-fg-secondary)' }}>
            {project.description}
          </p>

          <div>
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              Scope
            </p>
            <ul className="flex flex-col gap-0">
              {project.scope.map((s) => (
                <li
                  key={s}
                  className="py-3 flex gap-3"
                  style={{ borderTop: '0.5px solid var(--color-border)' }}
                >
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-fg)' }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure
            className="pl-5 py-2 mt-4"
            style={{ borderLeft: '0.5px solid var(--color-primary)' }}
          >
            <blockquote
              className="text-[18px]"
              style={{ color: 'var(--color-fg)', lineHeight: 1.45 }}
            >
              &ldquo;{project.testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-3 mono" style={{ color: 'var(--color-fg-muted)' }}>
              {project.testimonial.author} — {project.testimonial.role}
            </figcaption>
          </figure>
        </div>
      </div>
    </article>
  )
}
