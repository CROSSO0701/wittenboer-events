// shared.js - injects nav + footer + active-link state on every page.
// Usage in each page: place <div id="nav-mount"></div>, <div id="footer-mount"></div>
// then <script src="shared.js" data-page="aanbod"></script> at end of body.

(function () {
  const currentPage = document.currentScript?.dataset.page || '';

  const navHTML = `
<nav class="nav">
  <div class="container nav__inner">
    <a href="index.html" class="nav__logo" aria-label="Wittenboer Events home">
      <img src="assets/logo/we-full.png" alt="Wittenboer Events" />
    </a>
    <ul class="nav__links">
      <li><a href="over-ons.html" data-page="over-ons">Over ons</a></li>
      <li class="nav__has-menu">
        <button class="nav__menu-trigger" aria-expanded="false" aria-haspopup="true" data-page="aanbod">
          Aanbod
          <svg class="nav__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav__menu" role="menu">
          <ul>
            <li><a href="aanbod.html" role="menuitem"><span class="nav__menu-label">Ons aanbod</span><span class="nav__menu-desc">Overzicht van wat we doen</span></a></li>
            <li><a href="pakketten.html" role="menuitem"><span class="nav__menu-label">Showpakketten</span><span class="nav__menu-desc">Kant-en-klaar - vanaf €495</span></a></li>
            <li><a href="aanbod-detail.html#geluid" role="menuitem"><span class="nav__menu-label">Geluid</span><span class="nav__menu-desc">Line-arrays, mixers, monitoring</span></a></li>
            <li><a href="aanbod-detail.html#licht" role="menuitem"><span class="nav__menu-label">Licht</span><span class="nav__menu-desc">Lichtontwerp, fixtures, programmering</span></a></li>
            <li><a href="aanbod-detail.html#stroomvoorziening" role="menuitem"><span class="nav__menu-label">Stroomvoorziening</span><span class="nav__menu-desc">Aggregaten en verdeelkasten</span></a></li>
            <li><a href="aanbod-detail.html#artiestenbegeleiding" role="menuitem"><span class="nav__menu-label">Artiesten</span><span class="nav__menu-desc">Tapes &amp; backstage van A tot Z</span></a></li>
          </ul>
        </div>
      </li>
      <li><a href="artiesten.html" data-page="artiesten">Artiesten</a></li>
      <li><a href="projecten.html" data-page="projecten">Projecten</a></li>
      <li><a href="contact.html" data-page="contact">Contact</a></li>
      <li class="nav__socials" aria-hidden="false">
        <a href="https://www.instagram.com/wittenboerevents/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg></a>
        <a href="https://www.facebook.com/profile.php?id=100054423193609" target="_blank" rel="noopener" aria-label="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
      </li>
      <li class="nav__cta">
        <a href="tel:+31627172876"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> 06 27 17 28 76</a>
      </li>
    </ul>
  </div>
</nav>`;

  const footerHTML = `
<footer class="footer">
  <div class="container">
    <div class="footer__top">
      <div class="footer__brand">
        <img src="assets/logo/we-full.png" alt="Wittenboer Events" />
        <p>Complete technische productie voor evenementen sinds 2014. Eén aanspreekpunt, van eerste belronde tot laatste pallet terug in de bus.</p>
      </div>
      <div class="footer__col">
        <h4>Site</h4>
        <ul>
          <li><a href="over-ons.html">Over ons</a></li>
          <li><a href="aanbod.html">Aanbod</a></li>
          <li><a href="pakketten.html">Showpakketten</a></li>
          <li><a href="artiesten.html">Artiesten</a></li>
          <li><a href="projecten.html">Projecten</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:+31627172876">06 27 17 28 76</a></li>
          <li><a href="mailto:info@wittenboerevents.nl">info@wittenboerevents.nl</a></li>
          <li><a href="https://wa.me/31627172876" target="_blank" rel="noopener">WhatsApp</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Adres</h4>
        <ul>
          <li>Het Schild 35</li>
          <li>5275 EE Den Dungen</li>
          <li><a href="https://maps.google.com/?q=Het+Schild+35+Den+Dungen" target="_blank" rel="noopener">Op de kaart →</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© ${new Date().getFullYear()} Wittenboer Events · KVK 65834921</p>
      <div class="footer__legal">
        <a href="#">Algemene voorwaarden</a>
        <a href="#">Privacybeleid</a>
      </div>
    </div>
  </div>
</footer>`;

  const navMount = document.getElementById('nav-mount');
  if (navMount) navMount.outerHTML = navHTML;
  const footerMount = document.getElementById('footer-mount');
  if (footerMount) footerMount.outerHTML = footerHTML;

  // mark active link
  if (currentPage) {
    document.querySelectorAll(`.nav__links [data-page="${currentPage}"]`).forEach((el) => {
      el.setAttribute('aria-current', 'page');
    });
  }

  // dropdown click toggle (hover already works via CSS)
  const trigger = document.querySelector('.nav__menu-trigger');
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    document.addEventListener('click', (e) => {
      if (!trigger.parentElement.contains(e.target)) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();
