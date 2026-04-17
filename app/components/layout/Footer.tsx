import Image from 'next/image'
import Link from 'next/link'
import { contact } from '../../lib/content/contact'
import { NAV_LINKS } from './nav-links'

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-surface-dark-1)',
        color: 'var(--color-fg-on-dark)',
      }}
    >
      <div className="container-inset pt-16 md:pt-20 pb-10">
        <div className="mb-12 md:mb-16 flex items-center gap-5">
          <Image
            src="/logo/we-mark.png"
            alt=""
            width={240}
            height={240}
            className="h-16 md:h-20 w-auto shrink-0"
          />
          <div>
            <h3
              className="uppercase"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 'clamp(1.75rem, 1.2rem + 3vw, 3.5rem)',
                letterSpacing: '-0.005em',
                lineHeight: 0.92,
                color: 'var(--color-fg-on-dark)',
              }}
            >
              Wittenboer<br />Events
            </h3>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}>
              WAT WE DOEN
            </p>
            <p className="max-w-[46ch] text-[15px]" style={{ color: 'var(--color-fg-on-dark-muted)', lineHeight: 1.55 }}>
              Complete technische productie voor evenementen van elke schaal. Eén aanspreekpunt,
              A-merk materiaal, persoonlijk contact, sinds 2014.
            </p>
          </div>

          <div>
            <p className="mb-3" style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
              NAVIGATIE
            </p>
            <ul className="flex flex-col gap-2.5 text-[15px]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:[color:var(--color-primary)]"
                    style={{ color: 'var(--color-fg-on-dark)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3" style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
              CONTACT
            </p>
            <ul className="flex flex-col gap-2.5 text-[15px]">
              <li>
                <a
                  href={contact.phone.href}
                  className="transition-colors hover:[color:var(--color-primary)]"
                  style={{ color: 'var(--color-fg-on-dark)' }}
                >
                  {contact.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={contact.email.href}
                  className="transition-colors hover:[color:var(--color-primary)]"
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
                  className="transition-colors hover:[color:var(--color-primary)]"
                  style={{ color: 'var(--color-fg-on-dark)' }}
                >
                  WhatsApp ↗
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3" style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
              ADRES
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
          className="mt-14 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ borderTop: '1px solid var(--color-border-on-dark)' }}
        >
          <p style={{ color: 'var(--color-fg-on-dark-muted)', fontSize: '13px' }}>
            © {new Date().getFullYear()} Wittenboer Events · {contact.legal.kvk}
          </p>
          <div className="flex items-center gap-5 text-[13px]">
            <a
              href={contact.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:[color:var(--color-primary)]"
              style={{ color: 'var(--color-fg-on-dark-muted)' }}
            >
              Instagram ↗
            </a>
            <a
              href={contact.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:[color:var(--color-primary)]"
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
