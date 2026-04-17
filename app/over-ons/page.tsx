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
        <section className="pt-32 md:pt-40 pb-20 md:pb-28">
          <div className="container-inset">
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
              {about.label}
            </p>
            <h1
              className="max-w-[15ch] mb-10"
              style={{ fontSize: 'clamp(3rem, 2rem + 5vw, 7rem)', lineHeight: 0.92 }}
            >
              {about.heading}
            </h1>

            <div className="grid gap-10 md:gap-14 md:grid-cols-[1fr_1.3fr] md:items-start">
              <div
                className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)]"
                style={{ backgroundColor: 'var(--color-surface-2)' }}
              >
                <Image
                  src={about.portrait.src}
                  alt={about.portrait.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-5">
                <p className="text-[17px] md:text-[19px]" style={{ color: 'var(--color-fg-secondary)', lineHeight: 1.55 }}>
                  {about.lead}
                </p>
                <p className="text-[16px]" style={{ color: 'var(--color-fg-secondary)', lineHeight: 1.6 }}>
                  {about.body}
                </p>
                <figure
                  className="mt-4 pl-5 py-3"
                  style={{ borderLeft: '2px solid var(--color-primary)' }}
                >
                  <p style={{ color: 'var(--color-fg)', fontSize: '17px', fontWeight: 600 }}>
                    Marnix Wittenboer
                  </p>
                  <p style={{ color: 'var(--color-fg-muted)', fontSize: '14px', marginTop: '2px' }}>
                    Oprichter · Technicus · Aanspreekpunt
                  </p>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--color-surface-1)' }}>
          <div className="container-inset">
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
              Waarom wij
            </p>
            <h2
              className="max-w-[16ch] mb-14"
              style={{ fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 5rem)' }}
            >
              Vijf redenen om terug te komen.
            </h2>

            <StaggerReveal className="grid gap-x-10 gap-y-10 md:grid-cols-2">
              {about.whyUs.map((w, i) => (
                <RevealItem key={w.title}>
                  <div className="flex items-start gap-5">
                    <span
                      aria-hidden
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full shrink-0"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-fg-on-dark)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 400,
                        fontSize: '18px',
                      }}
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <h3 style={{ fontSize: 'clamp(1.5rem, 1.2rem + 0.8vw, 1.875rem)', fontWeight: 700, letterSpacing: '-0.025em' }}>
                        {w.title}
                      </h3>
                      <p className="mt-2 text-[15.5px]" style={{ color: 'var(--color-fg-secondary)', lineHeight: 1.6 }}>
                        {w.body}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--color-surface-dark)', color: 'var(--color-fg-on-dark)' }}>
          <div className="container-inset text-center max-w-3xl mx-auto">
            <h2
              className="uppercase mx-auto"
              style={{
                color: 'var(--color-fg-on-dark)',
                fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 5rem)',
                lineHeight: 0.95,
              }}
            >
              {about.closing.heading}
            </h2>
            <div className="mt-10 inline-flex">
              <Link
                href={about.closing.href}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-[16px] transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-fg-on-dark)',
                  fontWeight: 600,
                }}
              >
                {about.closing.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
