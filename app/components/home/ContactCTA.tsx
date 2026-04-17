import { home } from '../../lib/content/home'
import { contact } from '../../lib/content/contact'

const CHANNELS = [
  { label: 'Bellen', value: contact.phone.display, href: contact.phone.href },
  { label: 'WhatsApp', value: 'Stuur een bericht', href: contact.whatsapp.href },
  { label: 'Mailen', value: contact.email.display, href: contact.email.href },
  { label: 'Langskomen', value: `${contact.address.street}, ${contact.address.city}`, href: contact.address.mapsHref },
] as const

export function ContactCTA() {
  const { contactCta } = home
  return (
    <section
      id="contact"
      className="py-24 md:py-32"
      style={{ backgroundColor: 'var(--color-surface-dark-1)', color: 'var(--color-fg-on-dark)' }}
    >
      <div className="container-inset">
        <div className="mb-12 max-w-3xl">
          <p className="mono mb-3" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
            {contactCta.label}
          </p>
          <h2 style={{ color: 'var(--color-fg-on-dark)' }} className="max-w-[20ch]">
            {contactCta.heading}
          </h2>
          <p
            className="mt-5 text-[var(--text-lg)]"
            style={{ color: 'var(--color-fg-on-dark-muted)', maxInlineSize: 'var(--measure-lead)' }}
          >
            {contactCta.lead}
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-4">
          {CHANNELS.map((c, i) => (
            <li key={c.label}>
              <a
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group flex items-center justify-between md:flex-col md:items-start md:justify-start md:gap-6 py-6 md:py-10 md:px-6 md:first:pl-0 md:last:pr-0 transition-colors"
                style={{
                  borderTop: '0.5px solid var(--color-border-on-dark)',
                  borderLeft: i > 0 ? '0.5px solid var(--color-border-on-dark)' : undefined,
                }}
              >
                <div>
                  <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                    {c.label}
                  </p>
                  <p
                    className="mt-2 text-[20px] md:text-[22px]"
                    style={{ color: 'var(--color-fg-on-dark)', fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    {c.value}
                  </p>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  style={{ color: 'var(--color-primary-soft)', transitionTimingFunction: 'var(--ease-out-quart)' }}
                >
                  <path d="M7 17L17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
