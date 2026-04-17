import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { about } from '../lib/content/about'
import { StaggerReveal, RevealItem } from '../components/shared/StaggerReveal'

export const metadata: Metadata = {
  title: 'Over ons',
  description: about.lead,
}

export default function OverOnsPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="container-inset">
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              {about.label}
            </p>
            <h1 className="max-w-[20ch] mb-10">{about.heading}</h1>

            <div className="grid gap-12 md:grid-cols-[1fr_1.3fr] md:items-start">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)]" style={{ backgroundColor: 'var(--color-surface-2)' }}>
                <Image
                  src={about.portrait.src}
                  alt={about.portrait.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-6">
                <p className="text-[var(--text-lg)]" style={{ color: 'var(--color-fg-secondary)' }}>
                  {about.lead}
                </p>
                <p style={{ color: 'var(--color-fg-secondary)' }}>{about.body}</p>
                <figure
                  className="mt-4 pl-5 py-2"
                  style={{ borderLeft: '0.5px solid var(--color-primary)' }}
                >
                  <p className="mono" style={{ color: 'var(--color-fg-muted)' }}>
                    Marnix Wittenboer
                  </p>
                  <p className="mt-1" style={{ color: 'var(--color-fg)' }}>
                    Oprichter · Technicus · Aanspreekpunt
                  </p>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--color-surface-1)' }}>
          <div className="container-inset">
            <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
              Waarom wij
            </p>
            <h2 className="max-w-[18ch] mb-14">Vijf redenen waarom klanten terugkomen.</h2>

            <StaggerReveal className="grid gap-0 md:grid-cols-2">
              {about.whyUs.map((w, i) => (
                <RevealItem
                  key={w.title}
                  className={`py-8 md:py-10 md:px-8 md:first:pl-0 ${i % 2 === 1 ? 'md:border-l' : ''}`}
                >
                  <div
                    style={{
                      borderTop: i > 1 ? '0.5px solid var(--color-border)' : undefined,
                      paddingTop: i > 1 ? '1.5rem' : undefined,
                    }}
                  >
                    <div className="flex items-baseline gap-4 mb-3">
                      <span className="mono" style={{ color: 'var(--color-primary)' }}>
                        0{i + 1}
                      </span>
                      <h3 style={{ fontSize: 'var(--text-display-sm)', fontWeight: 600 }}>{w.title}</h3>
                    </div>
                    <p style={{ color: 'var(--color-fg-secondary)' }}>{w.body}</p>
                  </div>
                </RevealItem>
              ))}
            </StaggerReveal>

            <style>{`
              @media (min-width: 768px) {
                section .md\\:border-l { border-left: 0.5px solid var(--color-border); }
              }
            `}</style>
          </div>
        </section>

        <section className="py-24 md:py-32" style={{ backgroundColor: 'var(--color-surface-dark)', color: 'var(--color-fg-on-dark)' }}>
          <div className="container-inset text-center">
            <h2 className="max-w-[22ch] mx-auto" style={{ color: 'var(--color-fg-on-dark)' }}>
              {about.closing.heading}
            </h2>
            <div className="mt-8 inline-flex">
              <Link
                href={about.closing.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-fg-on-dark)',
                  fontWeight: 500,
                }}
              >
                {about.closing.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
