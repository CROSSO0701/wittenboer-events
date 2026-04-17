import Link from 'next/link'
import { contact } from '../../lib/content/contact'
import { NAV_LINKS } from './nav-links'

export function Footer() {
  return (
    <footer
      className="mt-[var(--space-5xl)]"
      style={{
        backgroundColor: 'var(--color-surface-dark)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[14px] font-bold tracking-tight"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-fg-on-dark)' }}
              >
                WE
              </span>
              <span className="text-[17px] tracking-tight" style={{ fontWeight: 600 }}>
                Wittenboer Events
              </span>
            </div>
            <p className="mt-5 max-w-[46ch]" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              Licht, geluid, stroom en productie voor evenementen van elke schaal. Sinds 2014 vanuit Sint-Michielsgestel.
            </p>
          </div>

          <div>
            <p className="mono mb-4" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              Navigatie
            </p>
            <ul className="flex flex-col gap-2 text-[15px]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:[color:var(--color-primary-soft)]"
                    style={{ color: 'var(--color-fg-on-dark)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mono mb-4" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              Contact
            </p>
            <ul className="flex flex-col gap-2 text-[15px]">
              <li>
                <a
                  href={contact.phone.href}
                  className="transition-colors hover:[color:var(--color-primary-soft)]"
                  style={{ color: 'var(--color-fg-on-dark)' }}
                >
                  {contact.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={contact.email.href}
                  className="transition-colors hover:[color:var(--color-primary-soft)]"
                  style={{ color: 'var(--color-fg-on-dark)' }}
                >
                  {contact.email.display}
                </a>
              </li>
              <li style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                {contact.address.street}
                <br />
                {contact.address.postal} {contact.address.city}
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-16 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ borderTop: '0.5px solid var(--color-border-on-dark)' }}
        >
          <p className="mono" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
            © {new Date().getFullYear()} Wittenboer Events · {contact.legal.kvk}
          </p>
          <div className="flex items-center gap-5">
            <a
              href={contact.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mono transition-colors hover:[color:var(--color-primary-soft)]"
              style={{ color: 'var(--color-fg-on-dark-muted)' }}
            >
              Instagram
            </a>
            <a
              href={contact.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mono transition-colors hover:[color:var(--color-primary-soft)]"
              style={{ color: 'var(--color-fg-on-dark-muted)' }}
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
