import { home } from '../../lib/content/home'
import { contact } from '../../lib/content/contact'

const CHANNELS = [
  { label: 'Bellen', value: contact.phone.display, href: contact.phone.href, icon: 'phone' },
  { label: 'WhatsApp', value: 'Stuur ons een berichtje', href: contact.whatsapp.href, icon: 'chat' },
  { label: 'Mailen', value: contact.email.display, href: contact.email.href, icon: 'mail' },
] as const

export function ContactCTA() {
  const { contactCta } = home
  return (
    <section
      id="contact"
      className="relative overflow-hidden py-24 md:py-32"
      style={{ backgroundColor: 'var(--color-surface-dark)', color: 'var(--color-fg-on-dark)' }}
    >
      <div className="container-inset">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start mb-10 md:mb-16">
          <div>
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
              {contactCta.label}
            </p>
            <h2
              className="uppercase"
              style={{
                color: 'var(--color-fg-on-dark)',
                fontSize: 'clamp(3rem, 2rem + 5vw, 6.5rem)',
                lineHeight: 1.05,
              }}
            >
              {contactCta.heading}
            </h2>
          </div>
          <p
            className="md:pt-6 text-[17px]"
            style={{ color: 'var(--color-fg-on-dark-muted)', maxInlineSize: '48ch', lineHeight: 1.55 }}
          >
            {contactCta.lead}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {CHANNELS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group relative flex flex-col justify-between gap-6 md:gap-10 p-5 md:p-8 rounded-[var(--radius-xl)] transition-all duration-500 hover:-translate-y-1"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--color-surface-dark-1) 80%, transparent)',
                border: '1px solid var(--color-border-on-dark)',
                transitionTimingFunction: 'var(--ease-out-quart)',
              }}
            >
              <span
                aria-hidden
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-fg-on-dark)',
                }}
              >
                {c.icon === 'phone' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                )}
                {c.icon === 'chat' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                )}
                {c.icon === 'mail' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                )}
              </span>

              <div>
                <p style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '14px', fontWeight: 500 }}>
                  {c.label}
                </p>
                <p
                  className="mt-1.5"
                  style={{
                    color: 'var(--color-fg-on-dark)',
                    fontSize: 'clamp(1.25rem, 1rem + 0.5vw, 1.625rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {c.value}
                </p>
              </div>

              <span
                aria-hidden
                className="absolute top-6 right-6 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                style={{ color: 'var(--color-fg-on-dark-muted)', transitionTimingFunction: 'var(--ease-out-quart)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M7 17L17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        {/* Address row */}
        <div
          className="mt-10 md:mt-14 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ borderTop: '1px solid var(--color-border-on-dark)' }}
        >
          <div style={{ color: 'var(--color-fg-on-dark)', fontSize: '15px' }}>
            <span style={{ color: 'var(--color-fg-on-dark-muted)' }}>Langskomen: </span>
            {contact.address.street}, {contact.address.postal} {contact.address.city}
          </div>
          <a
            href={contact.address.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[14px]"
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            Route op Maps
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M7 17L17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
