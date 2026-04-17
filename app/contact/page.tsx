import type { Metadata } from 'next'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { ContactForm } from '../components/contact/ContactForm'
import { contact } from '../lib/content/contact'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Bel, app of mail Wittenboer Events in Sint-Michielsgestel. Persoonlijk contact met Marnix. We denken graag vroeg mee.',
}

const CHANNELS = [
  { label: 'Bellen', value: contact.phone.display, href: contact.phone.href },
  { label: 'WhatsApp', value: 'Stuur een bericht', href: contact.whatsapp.href },
  { label: 'Mailen', value: contact.email.display, href: contact.email.href },
  { label: 'Langskomen', value: `${contact.address.street}, ${contact.address.city}`, href: contact.address.mapsHref },
] as const

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 md:pt-40 pb-24">
          <div className="container-inset">
            <div className="grid gap-14 md:gap-16 md:grid-cols-[1.1fr_1fr] md:items-start">
              <div>
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
                  Contact
                </p>
                <h1
                  className="max-w-[14ch] mb-8"
                  style={{ fontSize: 'clamp(3rem, 2rem + 5vw, 7rem)', lineHeight: 0.92 }}
                >
                  Laten we beginnen bij koffie.
                </h1>
                <p
                  className="text-[17px] md:text-[19px] mb-12"
                  style={{ color: 'var(--color-fg-secondary)', maxInlineSize: '52ch', lineHeight: 1.55 }}
                >
                  Elke productie begint met een goed gesprek. Bel, app of stuur een bericht.
                  Binnen twee werkdagen hoor je van ons.
                </p>

                <ul className="flex flex-col">
                  {CHANNELS.map((c, i) => (
                    <li key={c.label}>
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="group flex items-center justify-between gap-4 py-5 transition-colors"
                        style={{
                          borderTop: '0.5px solid var(--color-border)',
                          borderBottom: i === CHANNELS.length - 1 ? '0.5px solid var(--color-border)' : undefined,
                        }}
                      >
                        <div>
                          <p style={{ color: 'var(--color-fg-muted)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            {c.label}
                          </p>
                          <p
                            className="mt-1 text-[18px]"
                            style={{ color: 'var(--color-fg)', fontWeight: 500, letterSpacing: '-0.01em' }}
                          >
                            {c.value}
                          </p>
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5"
                          style={{ color: 'var(--color-primary)', transitionTimingFunction: 'var(--ease-out-quart)' }}
                        >
                          <path d="M7 17L17 7" />
                          <path d="M8 7h9v9" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <p
                    className="mb-3"
                    style={{
                      color: 'var(--color-fg-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Adres & bereikbaarheid
                  </p>
                  <p style={{ color: 'var(--color-fg)' }}>
                    {contact.address.street}
                    <br />
                    {contact.address.postal} {contact.address.city}
                  </p>
                  <p className="mt-3" style={{ color: 'var(--color-fg-secondary)' }}>
                    {contact.hours.weekdays}
                    <br />
                    <span style={{ color: 'var(--color-fg-muted)' }}>{contact.hours.always}</span>
                  </p>
                </div>
              </div>

              <div
                className="rounded-[var(--radius-xl)] border p-6 md:p-8"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-1)' }}
              >
                <p
                  className="mb-6"
                  style={{
                    color: 'var(--color-tertiary-deep)',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Of stuur direct een bericht
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
