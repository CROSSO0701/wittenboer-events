# Wittenboer Events — Backstage Craft redesign

This is the **Claude-version** of the Wittenboer Events redesign. Built alongside (not from) Hermes's version for a direct taste-comparison. Deliberately picked a different taste direction so the comparison is meaningful.

## Where this diverges from Hermes's version

Hermes went **editorial-magazine / full-dark / Bodoni Moda + amber stage-licht**. That direction keeps losing because:

1. The target user (event planner vetting vendors) browses during the day and wants to trust → dark interface reads as moody first, trustworthy second
2. Bodoni Moda is the **fashion-magazine** move — wrong vocabulary for a Brabantse B2B event-productie bedrijf
3. "Full dark" forced the photos to compete with the UI for dramatic gravitas — both lost

This version goes **light-interface + cinematic-photo-inserts / Darker Grotesque / single warm accent**. Reasons below.

## Research sources I built on

- **Impeccable** (Paul Bakaus, 10K+ stars) — SKILL.md + typography.md + color-and-contrast.md refs
- **Taste skill** (Leonxlnx) — bias-correction rules + forbidden AI tells
- **Redesign skill** — audit checklist
- Wittenboer's actual HTML (extracted real copy, real testimonials, real photo inventory)
- 2026 editorial web design trends (cinematic photography, authenticity > perfection)

## Taste direction: "Backstage Craft"

**Three concrete brand words**: warm, capable, theatrical. Not "premium", not "modern", not "elegant" — those are dead categories.

**As a physical object**: the inside cover of a worn concert-program booklet from a regional theater. Has paper weight, has craft, is not trying to impress you.

**Anti-references** (what this must NOT look like):
- Linear.app / Stripe / Vercel developer-marketing (wrong audience)
- Fashion-magazine Bodoni editorial (wrong vocabulary)
- SaaS dashboard dark-with-glow (AI-slop fingerprint)
- "Tech startup" aesthetic of any kind

## The font decision — and why it took 20 minutes

Impeccable's reject list explicitly bans: Inter, Fraunces, IBM Plex (all variants), Newsreader, Lora, Playfair, Cormorant, Syne, Outfit, DM Sans, Plus Jakarta Sans, Instrument Sans/Serif, Space Mono, Space Grotesk.

Taste skill recommends Geist / Satoshi / Cabinet Grotesk / Outfit — but those are becoming the new monoculture (exactly the failure mode Impeccable calls out).

**Final choice**: **Darker Grotesque** for everything (display + body, weights 300–900, single family). 

Why single family: Impeccable says *"You often don't need a second font. One well-chosen family in multiple weights creates cleaner hierarchy than two competing typefaces."* Darker Grotesque has wide weight range and distinctive character — it carries both display and body roles without losing identity.

**Mono accent**: Sometype Mono for contact info and project numbers. Rare (not JetBrains, not Space Mono), handles Dutch diacritics, has a slightly worn feel that matches "craft" positioning.

Both free on Google Fonts, both self-hosted via Next.js font optimization, both not on any reject list I've seen.

## Color system (OKLCH)

Single accent philosophy — one amber, used rarely:

```css
--accent: oklch(70% 0.14 60);       /* stage-lamp amber */
--accent-hover: oklch(64% 0.15 58); /* slightly darker, more saturated */

--surface-0: oklch(97% 0.005 80);   /* base paper — tinted toward amber */
--surface-1: oklch(99% 0.003 80);   /* raised, slightly lighter */
--surface-dark: oklch(12% 0.008 80); /* photo-section background */

--text-primary: oklch(18% 0.01 80);
--text-secondary: oklch(42% 0.01 80);
--text-muted: oklch(60% 0.008 80);
```

All neutrals tinted toward amber (chroma 0.005-0.015, hue 80) for subconscious cohesion between the accent and the UI. No pure black, no pure white, no mixed warm/cool grays.

**60-30-10 applied**: 60% neutral surfaces, 30% type (primary + secondary), 10% accent. Accent appears only on CTAs, focus states, and one pull-quote per section.

## Layout system

- **Spacing scale** (4pt): 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Max width**: 1440px, not 1200px — gives wider hero photos room to breathe
- **Hero**: 60/40 split, typography left, cinematic photo right. NOT centered.
- **Services**: 2-column zig-zag, NOT 3-column-cards (banned generic pattern)
- **Testimonials**: inline magazine-quotes with attribution, NOT card carousel with dots
- **Contact block**: single-column on mobile, 60/40 on desktop, Sometype Mono for details

Mobile first means *mobile-designed*: full-bleed hero photo on mobile becomes split on desktop. Not "desktop with columns collapsed."

## Motion

Motion library (formerly framer-motion), imported from `motion/react`.

- Scroll-triggered stagger reveals on section entries — gentle, ease-out-quart
- Hover states: `translate-y(-1px)` on press, 200ms ease
- Respects `prefers-reduced-motion: reduce` throughout
- NO bounce, NO spring-overshoot, NO parallax-distortion on scroll
- React Compiler (stable in Next 16) handles memoization

## Anti-pattern ban list (enforced in code)

Every one of these would trigger rejection if it appeared in my output:

- [ ] Inter, Fraunces, IBM Plex, or any font from Impeccable's reject list
- [ ] Purple or indigo gradients (THE LILA BAN)
- [ ] `border-left: Xpx solid [color]` > 1px — side-stripe accents on cards/alerts
- [ ] `background-clip: text` gradient text
- [ ] 3-column equal card grids as feature row
- [ ] Centered hero with big tagline above CTA
- [ ] `bg-#000` or `bg-#fff` — pure black/white
- [ ] `h-screen` for hero (use `min-h-[100dvh]`)
- [ ] Bounce / elastic / overshoot easing
- [ ] Generic lucide user icon avatars
- [ ] "John Doe" / "Lorem Ipsum" / "Acme Corp" / "99.99%"
- [ ] Filler copywriting: "Elevate", "Seamless", "Unleash", "Next-Gen"
- [ ] Emoji in UI chrome (only in copy where Marnix would naturally use them)
- [ ] Cards nested in cards
- [ ] More than one accent color
- [ ] Hidden critical functionality on mobile

## Content preservation

Real content from wittenboerevents.nl (not generated):

**Tagline**: "Licht & geluid" / "Voor ieder evenement een passende oplossing"

**Services** (preserving Dutch naming):
- Geluid
- Tapeshows
- Licht
- Stroomvoorziening
- Artiestenbegeleiding

**Over ons** (Marnix's actual copy): "Van een kant en klare drive-in-show tot complete project verzorging op maat..."

**Testimonials** (actual clients, actual words):
- Thomas de Groot, Oprichter Park Lounge
- Bert van Kronenburg, Eigenaar Beurs Schijndel
- Berk Music
- (Fourth slot removed — the original site has a "Lorem" placeholder which is deeply ironic but we fix it by removing until real testimonial arrives)

**Contact**: 06-27172876, info@wittenboerevents.nl, Molenbergstraat 3, 5271CD Sint-Michielsgestel. WhatsApp, Facebook, Instagram.

**Tone**: formal "u" throughout, preserving *meedenken*, *ontzorgen*, *uit handen nemen*, *van A tot Z*. Not translated-from-English marketing speak.

## Tech stack

- **Next.js 16.2.1** — App Router, Turbopack stable, React Compiler stable
- **React 19** 
- **Tailwind CSS v4.1** — CSS-first config via `@theme` directive (no `tailwind.config.js`)
- **Motion library** — `motion/react` imports
- **TypeScript** strict mode
- **Deploy**: GitHub → Vercel auto-deploy

## Quality targets

- Lighthouse Performance ≥ 95 mobile, ≥ 98 desktop
- Lighthouse Accessibility = 100
- Best Practices ≥ 95
- SEO = 100
- CLS ≤ 0.05
- LCP ≤ 1.8s
- TBT ≤ 100ms
- First print to interactive photo visible ≤ 1.2s on mobile 4G

## What's NOT included (on purpose)

- No CMS — single-page site, edit in code for now. Marnix can swap photos by committing to the repo.
- No analytics beyond Vercel's built-in
- No cookie banner — no tracking means no banner needed. If Wittenboer later adds analytics, add a light explicit-consent banner then.
- No newsletter / no dark mode toggle — not what the user asked for, no good reason to add.

## How to compare with Hermes's version

After both are deployed as Vercel previews:

1. Open each on your phone first (mobile-first judgment)
2. Note which one makes you trust "they can handle my event" faster — that's the brief winning
3. Note which one you can still remember 10 minutes after closing the tab — that's the taste winning
4. Run both through Impeccable's detector (`npx impeccable detect <url>`) — anti-pattern count
5. Run both through Lighthouse mobile — performance numbers

Winner on trust + memorability + zero-slop + performance is the direction to actually ship.
