import Image from 'next/image'
import Link from 'next/link'
import { contact } from '../../lib/content/contact'
import { NAV_LINKS } from './nav-links'

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-surface-dark)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset pt-20 md:pt-24 pb-10">
        {/* Big wordmark with logo mark */}
        <div className="mb-14 md:mb-20 flex items-start gap-6 md:gap-10 flex-wrap">
          <Image
            src="/logo/we-mark.png"
            alt=""
            width={280}
            height={280}
            className="h-24 md:h-32 w-auto shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="mono mb-4" style={{ color: 'var(--color-primary-soft)' }}>
              Licht · Geluid · Productie · Sinds 2014
            </p>
            <h3
              style={{
                fontSize: 'clamp(2.5rem, 1.8rem + 5vw, 6.5rem)',
                fontWeight: 600,
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
                color: 'var(--color-fg-on-dark)',
              }}
            >
              wittenboer<br />
              <span style={{ color: 'var(--color-primary-soft)', fontStyle: 'italic', fontWeight: 400 }}>
                events.
              </span>
            </h3>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="mono mb-4" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              Wat wij doen
            </p>
            <p className="max-w-[46ch]" style={{ color: 'var(--color-fg-on-dark)' }}>
              Complete technische productie voor evenementen van elke schaal. Eén aanspreekpunt,
              A-merk materiaal, persoonlijk contact.
            </p>
          </div>

          <div>
            <p className="mono mb-4" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              Navigatie
            </p>
            <ul className="flex flex-col gap-2.5 text-[15px]">
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
            <ul className="flex flex-col gap-2.5 text-[15px]">
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
              <li>
                <a
                  href={contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:[color:var(--color-primary-soft)]"
                  style={{ color: 'var(--color-fg-on-dark)' }}
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mono mb-4" style={{ color: 'var(--color-fg-on-dark-muted)' }}>
              Adres
            </p>
            <p style={{ color: 'var(--color-fg-on-dark)', fontSize: '15px' }}>
              {contact.address.street}
              <br />
              <span style={{ color: 'var(--color-fg-on-dark-muted)' }}>
                {contact.address.postal} {contact.address.city}
              </span>
            </p>
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
              Instagram ↗
            </a>
            <a
              href={contact.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mono transition-colors hover:[color:var(--color-primary-soft)]"
              style={{ color: 'var(--color-fg-on-dark-muted)' }}
            >
              Facebook ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
