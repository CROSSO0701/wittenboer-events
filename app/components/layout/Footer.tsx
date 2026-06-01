import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Image
              src="/logo/we-full.png"
              alt="Wittenboer Events"
              width={560}
              height={170}
              style={{ height: 48, width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: 24 }}
            />
            <p>
              Complete technische productie voor evenementen sinds 2014. Eén aanspreekpunt,
              van eerste belronde tot laatste pallet terug in de bus.
            </p>
          </div>
          <div className="footer__col">
            <h4>Site</h4>
            <ul>
              <li><Link href="/over-ons">Over ons</Link></li>
              <li><Link href="/aanbod">Aanbod</Link></li>
              <li><Link href="/show-pakketten">Showpakketten</Link></li>
              <li><Link href="/artiesten">Artiesten</Link></li>
              <li><Link href="/projecten">Projecten</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:+31627172876">06 27 17 28 76</a></li>
              <li><a href="mailto:info@wittenboerevents.nl">info@wittenboerevents.nl</a></li>
              <li><a href="https://wa.me/31627172876" target="_blank" rel="noopener">WhatsApp</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Adres</h4>
            <ul>
              <li>Het Schild 35</li>
              <li>5275 EE Den Dungen</li>
              <li>
                <a
                  href="https://maps.google.com/?q=Het+Schild+35+Den+Dungen"
                  target="_blank"
                  rel="noopener"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Op de kaart
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© {year} Wittenboer Events · KVK 65834921</p>
        </div>
      </div>
    </footer>
  )
}
