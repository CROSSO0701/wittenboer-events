# Wittenboer Events - design system (zoals geshipt)

Dit beschrijft het ontwerp zoals het daadwerkelijk live staat. De tokens, fonts en
kleuren hieronder zijn 1-op-1 overgenomen uit `app/globals.css` (`@theme`) en de
font-imports in `app/layout.tsx`. Dit is de bedoelde eindlook en blijft zo: fonts,
kleuren en design-tokens niet wijzigen zonder overleg.

## Doelgroep

Eventorganisatoren, festivaldirecteuren, corporate eventmanagers en zaaleigenaren in
Brabant en de rest van NL. Professionals die productiediensten boeken (geluid, licht,
podium, stroom, artiestenbegeleiding) en daarnaast de show-pakketten kunnen huren. Ze
vergelijken Wittenboer overdag, op laptop en telefoon, met twee of drie andere
productiebedrijven. Ze moeten snel vertrouwen krijgen en zonder wrijving bij de
contactgegevens komen.

**Job-to-be-done**:
1. Bevestigen dat dit bedrijf hun evenement aankan (festival, corporate, tuinfeest, beurs).
2. Bewijs van eerder werk zien (foto's, klantnamen, projecttypes).
3. Contact opnemen voor een offerte of een vrijblijvend gesprek.

## Merkpersoonlijkheid

**Drie woorden**: warm, capabel, theatraal. Niet "premium", niet "modern".

**Als fysiek object**: de binnenzijde van een goed gebruikt concertprogramma uit een
regionaal theater. Heeft papiergewicht, heeft vakmanschap, probeert je niet te imponeren.

**Stem**: professioneel Nederlands B2B met de formele "u"-vorm. Warm, capabel,
ongekunsteld. Gebruikt het vocabulaire uit de branche: *meedenken*, *ontzorgen*,
*uit handen nemen*, *van A tot Z*. Geen marketing-speak, geen corporate jargon.

**Anti-referenties** (wat dit niet mag zijn): Linear / Stripe / Vercel
developer-marketing, fashion-magazine serif-editorial, SaaS-dashboard dark-with-glow,
"tech startup"-look van welke soort dan ook.

## Typografie (geshipt)

Drie families, allemaal via `next/font/google` self-hosted (zie `app/layout.tsx`):

- **Anton** (display) - `--font-display`, weight 400. Voor `h1`/`h2`, hero, sectiekoppen,
  metric-cijfers, marquee-namen. Altijd `text-transform: uppercase`, `letter-spacing`
  rond `0.01em`, `line-height` `1.05`. Eén dik gewicht, hoog contrast met de body.
- **Figtree** (body) - `--font-body`, weights 400/500/600/700. Voor lopende tekst,
  knoppen, navigatie en de subkoppen `h3`/`h4` (Figtree 700, strakke `letter-spacing`
  `-0.025em`). Body op 16px, `line-height` 1.55, `text-wrap: pretty`.
- **JetBrains Mono** (mono) - `--font-mono`, weights 400/500. Voor stapnummers
  (approach), projectnummers en technische details. Sober, leesbaar, goede diacritics.

Fallback-stacks staan in `@theme`:
`--font-display: var(--font-display), "Anton", "Impact", ui-sans-serif, sans-serif;`
en analoog voor body (Figtree) en mono.

Display-schaal (clamp-tokens):
`--text-display-xl` t/m `--text-display-sm`, plus per-sectie `clamp()` op de grote koppen.

## Kleursysteem

Petrol/zand-palet. De meeste tokens staan als hex in `@theme`; `--color-danger`
en enkele mengkleuren gebruiken OKLCH / `color-mix(in oklch|oklab, …)`. Geen puur
zwart, geen puur wit: de donkere secties zijn petrol-tint `#2A3840`, de basis is een
off-white `#F5F5F6`.

**Primary - petrol/teal**
- `--color-primary: #157A8C` (CTA's, focus, accenten)
- `--color-primary-hover: #0F6374`
- `--color-primary-soft: #E3F0F3`
- `--color-primary-deep: #0B4A57`

**Secondary - koel grijsblauw**
- `--color-secondary: #546A72`, `-deep: #3B4D54`, `-darker: #2A3840` (o.a. footer),
  `-soft: #E1E6E8`

**Tertiary - zand/warm (het "stage"-accent op donkere secties)**
- `--color-tertiary: #D9C5B2`, `-deep: #B8A088`, `-soft: #F3EAE0`
  Zand wordt gebruikt als kicker- en accentkleur op donkere achtergronden
  (hero-accent, quote-mark, stats-cijfers, footer-koppen).

**Neutralen / oppervlakken**
- `--color-bg: #F5F5F6`, `--color-card: #FBFBFC`,
  `--color-surface-1: #EDEEEF`, `--color-surface-2: #E2E3E5`
- Donker: `--color-surface-dark: #2A3840`, `--color-surface-dark-1: #3B4D54`

**Tekst**
- `--color-fg: #1E2A2F`, `-secondary: #3E3F42`, `-muted: #636466`
- Op donker: `--color-fg-on-dark: #F5F5F6`, `-on-dark-muted: #B0BEC4`

**Status / randen**
- `--color-danger: oklch(55% 0.14 25)` (donkerrood, >=4.5:1 op de off-white surface)
- `--color-border: #DCDEE0`, `-strong: #B6B9BC`, `-on-dark: #4A5C65`

Twee accenten naast elkaar zijn hier toegestaan en bewust: **petrol** (`primary`) op
lichte secties en CTA's, **zand** (`tertiary`) op donkere secties. Dat is het
geshipte systeem, geen anti-pattern.

## Layout

Tokens in `@theme`:
- Spacing: `--space-2xs` (0.25rem) t/m `--space-5xl` (9rem).
- Container: `--container-max: 1400px`, inset `clamp(1.25rem, 2vw + 0.5rem, 2.5rem)`.
- Radii: `--radius-sm/md/lg/xl` (0.25–1.25rem). Knoppen en pills gebruiken `999px`.

Principes zoals geïmplementeerd:
- Asymmetrische, redactionele opbouw. Hero is een donkere full-bleed foto-sectie met
  petrol/petrol-overlay, grote Anton-kop met zand-accentregel, lead + CTA-rij + een
  drie-koloms metrics-balk.
- Services-preview is een **bento-grid** (12 koloms, `span-7-r2` / `span-5` / `span-4`),
  niet drie gelijke kaarten op een rij.
- Featured work: kaarten met een "color-gel"-foto die van grijs naar kleur opklaart bij
  hover (op touch-devices direct in kleur via `@media (hover: none)`).
- Artists: roster-grid met grijs-naar-kleur portretten.
- Quotes: één grote quote-hero (donker, zand quote-mark) plus kleinere support-quotes,
  geen carousel met dots.
- Approach: drie stappen met mono-genummerde labels en een dunne scheidingslijn.
- Donkere secties zetten hun eigen tekst- en kicker-kleuren (zand) inline.

## Motion

Motion library, import altijd uit `motion/react`. CSS-gedreven reveals plus
JS-georkestreerde varianten.

- Scroll-reveals: `[data-reveal]` met varianten `fade/left/right/scale` en
  `[data-reveal-delay]` / `[data-reveal-stagger]` voor staggering.
- Easing-tokens: `--ease-out-quart: cubic-bezier(0.25,1,0.5,1)` en
  `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`. Geen bounce, geen spring-overshoot.
- Split-text op koppen (`.split-line` / `.split-word`), image-zoom bij in-view
  (`[data-img-zoom]`), subtiele parallax (`[data-parallax]`), scroll-progress-balk,
  `.hover-lift` (translateY -3px + zachte schaduw).
- Nav: vaste balk die bij scroll krimpt en transparant-over-hero wordt (`nav--over-hero`).

## Anti-pattern ban list (afgedwongen in code)

Deze blijven verboden. Let op: dit verbiedt **niet** de fonts/kleuren die de site
legitiem gebruikt (Anton/Figtree/JetBrains Mono, petrol + zand) - die zijn juist het
systeem.

- [ ] "Lorem Ipsum" / "John Doe" / "Acme Corp" / "99.99%" - alleen echte content,
      echte cijfers, echte mensen.
- [ ] Puur zwart (`#000`) of puur wit (`#fff`) - gebruik de tokens uit `globals.css`.
- [ ] Paarse/indigo gradients (de lila-ban).
- [ ] `background-clip: text` gradient-tekst.
- [ ] `h-screen` op de hero - gebruik `min-h-[100dvh]` / de hero-paddings.
- [ ] Drie gelijke feature-kaarten op een rij (de bento-grid is de bedoeling).
- [ ] Bounce / elastic / overshoot easing.
- [ ] Gecentreerde hero met grote tagline boven één CTA.
- [ ] Generieke lucide user-icon avatars.
- [ ] Filler-copy: "Elevate", "Seamless", "Unleash", "Next-Gen".
- [ ] Emoji in UI-chrome (alleen in copy waar Marnix dat natuurlijk zou doen).
- [ ] Em-dashes (lange streepjes) - gebruik koppelteken, dubbele punt, komma of haakjes.
- [ ] Informele aanspreekvorm - altijd de formele "u".
- [ ] Kritieke functionaliteit verbergen op mobiel.

## Content (echt, niet gegenereerd)

**Services** (Nederlandse naamgeving behouden): Geluid, Tapeshows, Licht,
Stroomvoorziening, Artiestenbegeleiding. Plus de show-pakketten als verhuur-lijn.

**Testimonials** (echte klanten): Thomas de Groot (oprichter Park Lounge),
Bert van Kronenburg (eigenaar Beurs Schijndel), Berk Music.

**Contact / vestiging**: 06-27172876, info@wittenboerevents.nl,
**Het Schild 35, 5275 EE Den Dungen**. WhatsApp, Facebook, Instagram.

## Toegankelijkheid

- WCAG AA minimum (AAA op kritieke paden).
- Alle bodytekst >= 4.5:1 contrast; `--color-danger` en `kicker` zijn gekozen om dat
  ook op getinte/donkere oppervlakken te halen.
- Zichtbare focus-rings: `:focus-visible` met 2px petrol outline + offset.
- Skip-link (`.skip-link`) voor WCAG 2.4.1.
- `prefers-reduced-motion` gerespecteerd; reveals/zoom vallen netjes terug.
- Alt-tekst op elke foto die het getoonde evenement beschrijft.
- Touch-targets >= 44px; `text-wrap: pretty` / `balance` tegen weeskinderen.

## Tech stack

- Next.js 16 App Router (Turbopack, React Compiler), React 19, TypeScript strict.
- Tailwind CSS v4 - CSS-first via `@theme` in `app/globals.css`, geen `tailwind.config.js`.
- Motion library - `motion/react`.
- Supabase (Postgres + Auth + SSR cookies).
- Deploy: Vercel.

## Kwaliteitsdoelen

- Lighthouse Performance >= 95 mobiel, >= 98 desktop.
- Lighthouse Accessibility = 100, Best Practices >= 95, SEO = 100.
- CLS <= 0.05, LCP <= 1.8s, TBT <= 100ms.
