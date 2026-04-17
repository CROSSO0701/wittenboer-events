import { home } from '../../lib/content/home'
import { contact } from '../../lib/content/contact'

const CHANNELS = [
  { label: 'Bellen', value: contact.phone.display, href: contact.phone.href },
  { label: 'WhatsApp', value: 'Direct een bericht', href: contact.whatsapp.href },
  { label: 'Mailen', value: contact.email.display, href: contact.email.href },
] as const

export function ContactCTA() {
  const { contactCta } = home
  return (
    <section
      id="contact"
      className="relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-dark-1)', color: 'var(--color-fg-on-dark)' }}
    >
      {/* Huge display wordmark — decorative */}
      <div
        aria-hidden
        className="container-inset pt-28 md:pt-36 pb-0 select-none"
      >
        <h2
          style={{
            fontSize: 'clamp(4.5rem, 2.5rem + 10vw, 13rem)',
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 0.85,
            color: 'var(--color-fg-on-dark)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Laten we
          <br />
          <span style={{ color: 'var(--color-primary-soft)', fontStyle: 'italic', fontWeight: 400 }}>
            beginnen.
          </span>
        </h2>
      </div>

      <div className="container-inset pt-12 pb-24 md:pb-32">
        {/* Copy row */}
        <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-end mb-16">
          <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
            {contactCta.label} · Sint-Michielsgestel
          </p>
          <p
            className="text-[var(--text-lg)]"
            style={{ color: 'var(--color-fg-on-dark-muted)', maxInlineSize: 'var(--measure-lead)' }}
          >
            {contactCta.lead}
          </p>
        </div>

        {/* Channels — asymmetric: 3 options + address card */}
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <ul className="flex flex-col">
            {CHANNELS.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group flex items-center justify-between gap-4 py-6 transition-colors"
                  style={{
                    borderTop: '0.5px solid var(--color-border-on-dark)',
                  }}
                >
                  <div className="flex items-baseline gap-5 md:gap-8">
                    <span className="mono shrink-0" style={{ color: 'var(--color-fg-on-dark-muted)', minWidth: '90px' }}>
                      {c.label}
                    </span>
                    <span
                      style={{
                        color: 'var(--color-fg-on-dark)',
                        fontSize: 'clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)',
                        fontWeight: 500,
                        letterSpacing: '-0.025em',
                      }}
                    >
                      {c.value}
                    </span>
                  </div>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    style={{ color: 'var(--color-primary-soft)', transitionTimingFunction: 'var(--ease-out-quart)' }}
                  >
                    <path d="M7 17L17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          <div
            className="rounded-[var(--radius-xl)] p-7 md:p-8 flex flex-col justify-between gap-6"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--color-surface-dark) 60%, transparent)',
              border: '0.5px solid var(--color-border-on-dark)',
            }}
          >
            <div>
              <p className="mono mb-3" style={{ color: 'var(--color-primary-soft)' }}>
                Adres
              </p>
              <p style={{ color: 'var(--color-fg-on-dark)', fontSize: '18px', fontWeight: 500 }}>
                {contact.address.street}
              </p>
              <p style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '15px', marginTop: '4px' }}>
                {contact.address.postal} {contact.address.city}
                <br />
                {contact.address.country}
              </p>
            </div>
            <div>
              <p className="mono mb-3" style={{ color: 'var(--color-primary-soft)' }}>
                Bereikbaarheid
              </p>
              <p style={{ color: 'var(--color-fg-on-dark)', fontSize: '15px' }}>
                {contact.hours.weekdays}
              </p>
              <p style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '14px', marginTop: '2px' }}>
                {contact.hours.always}
              </p>
            </div>

            <a
              href={contact.address.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mono self-start inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-primary-soft)' }}
            >
              Route op Maps
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M7 17L17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
