# Claude Code briefing - Wittenboer Events

## Wat dit is
Editorial-redesign van wittenboerevents.nl: licht/geluid/podia + show-pakket-verhuur, met booking-backend voor artiesten en admin. Frontend wordt door Claude Design (web app) per groep aangeleverd; backend is hier al gebouwd als blueprint. Jij (Claude Code) bouwt door waar de blueprint stopt en helpt met merging, debugging en deploy.

## Stack - niet aanpassen zonder overleg
- Next.js 16.2.1 App Router + Turbopack
- React 19, TypeScript strict
- Tailwind CSS v4 (CSS-first, géén `tailwind.config.js`)
- Motion library - import altijd uit `motion/react` (niet `framer-motion`)
- Supabase (Postgres + Auth + SSR cookies)
- Forms: react-hook-form + Zod 4
- Mail: Resend (via fetch in `app/lib/integrations/resend.ts` - geen `resend` package gebruiken)
- Hosting: Vercel (project `wittenboer-nextjs` is al gelinkt - zie `.vercel/project.json`)
- Package manager: pnpm

## Eerste actie als de gebruiker zegt "begin"
```bash
pnpm install
pnpm dev
```
Open http://localhost:3000, controleer dat `/`, `/over-ons`, `/aanbod`, `/artiesten`, `/projecten`, `/contact` allemaal renderen zonder errors. Rapporteer wat je ziet.

## Structuur op hoofdlijnen
```
app/
  page.tsx, over-ons/, aanbod/[slug]/, artiesten/, projecten/, contact/   ← frontend (Design's territorium)
  components/{home,layout,services,artists,projects,contact,shared,ui}/   ← React components
  lib/
    content/        ← TS data files (artists, projects, services, home, …)
    motion.ts       ← gedeelde Motion variants
    utils.ts        ← cn() helper
    db/             ← Supabase clients + types  (BACKEND, niet aanraken behalve types regenereren)
    schemas/        ← Zod schemas (inquiry, booking)
    auth/           ← requireAdmin/Artist + rate-limit
    integrations/   ← google-calendar, artwinlive, resend
    email/          ← React-rendered mail templates + render.ts
  api/
    contact/        ← oude route, vervangen door inquiry zodra ContactForm meegaat
    inquiry/        ← discriminated-union endpoint voor 3 formuliertypes
    bookings/[id]/{accept,decline,assign-staff}/
    cron/artwinlive-sync/
    portal/artist/bookings/

supabase/migrations/  ← 3 SQL files: schema, RLS, seed (4 pakketten + 8 artiesten)
public/photos/        ← bestaande foto's (event/artist/project)
.env.example          ← alle env-vars
```

## Wat klaar is (geshipt)
- **Frontend volledig**: Hero met split-text, ApproachStrip line-draw, FeaturedWork color-gel, ContactCTA, TrustedBy marquee, ServicesPreview bento-grid, over-ons met count-up, page-transitions, Sonner toaster, shadcn-stijl Button. Publieke pagina's onder `app/(public)/`. TypeScript clean.
- **Show-pakketten**: `app/(public)/show-pakketten/page.tsx` + brochure-PDF (`show-pakketten/brochure/BrochurePdf.tsx`, A4 downloadbaar). 5 pakketten (de oorspronkelijke 4 + "Black & Gold").
- **Portals**: `app/(portal)/portal/` met `login`, `artiest`, `admin` (incl. `integraties`, `personeel`, `inkomend`, `aanvragen`, `agenda`, `klanten`, `artiesten`, `archief`, `log`), `account`, `inbox`.
- **Backend volledig**: schema, RLS, seed, types, Zod-schemas, auth-helpers, integraties, mail-templates, alle API-routes. Compileert clean. Faalt netjes zonder credentials.
- **Infra**: `proxy.ts` (Supabase auth-cookie-refresh voor `/portal/*`), `vercel.json` met cron op `/api/cron/artwinlive-sync` (`0 6 * * *`), `/api/oauth/google/start` + `/api/oauth/google/callback` (Google Calendar refresh-token), auth-profile-trigger (`profiles`-rij bij nieuwe `auth.users`), artiest- en personeel-invite (`/api/admin/artists/invite`, `/api/admin/staff/invite`), inquiry-endpoint live in de formulieren.

## Nog te doen
- **Live-koppelingen configureren via de admin**: Marnix verbindt Google Calendar (OAuth-consent op de integraties-pagina) en zet de ArtwinLive iCal-URL + CallMeBot in `/portal/admin/integraties`. Credentials komen in de `integration_credentials`-tabel, niet in env-vars.
- **Eerste admin promoveren**: na de eerste inlog handmatig `role='admin'` zetten via de SQL editor (zie `supabase/README.md`). De trigger maakt nieuwe profielen standaard als `staff`.
- **Supabase migrations pushen naar productie** zodra het project gelinkt is (zie `supabase/README.md`).
- **Types regenereren** na schema-wijzigingen: `pnpm dlx supabase gen types typescript ... > app/lib/db/types.generated.ts`.

## Niet aanraken
- `app/lib/db/`, `app/lib/schemas/`, `app/lib/auth/`, `app/lib/integrations/`, `app/lib/email/`, `app/api/inquiry/`, `app/api/bookings/`, `app/api/cron/`, `app/api/portal/`, `supabase/` - backend-blueprint, gemerged, hands-off behalve type-regen + bugfix.
- `app/components/shared/MagneticButton.tsx` - deprecation-shim, blijft staan tot iemand `git rm` doet.
- `package.json` deps zonder reden - alle benodigde deps staan er. Vraag bij twijfel.

## Design-direction (geshipt - zie DESIGN.md)
- **Fonts**: Anton (display/koppen, uppercase), Figtree (body + subkoppen), JetBrains Mono (nummers/details). Self-hosted via `next/font/google` in `app/layout.tsx`. Niet wijzigen.
- **Kleuren**: petrol/zand-palet. Petrol `--color-primary: #157A8C` op CTA's/licht, zand `--color-tertiary: #D9C5B2` als accent op donkere secties. Off-white surfaces, donker `#2A3840`. Tokens in `app/globals.css` (`@theme`). Niet wijzigen.
- **Layout/motion**: bento-grid services, asymmetrische hero, color-gel foto's, Motion via `motion/react`, easing `--ease-out-quart`/`--ease-out-expo`, geen bounce.

## Hard verboden
- `bg-#000` / `bg-#fff` (gebruik de tokens uit `globals.css`)
- Paarse/indigo gradients
- `h-screen` op hero (gebruik `min-h-[100dvh]`)
- 3-kolom equal feature-cards (de bento-grid is de bedoeling)
- Bounce/elastic/overshoot easing
- "Lorem Ipsum", "John Doe", "99.99%"
- Emoji in UI chrome
- Em-dashes (lange streepjes) overal: gebruik koppelteken, dubbele punt, komma of haakjes
- Informele aanspreekvorm: altijd de formele "u"

## Tone of voice (NL)
Formeel "u". Marnix-stijl: *ontzorgen, meedenken, van A tot Z*. Geen marketing-speak.

## Reference docs
| File | Voor |
|---|---|
| `DESIGN.md` | Design-system (Anton/Figtree/JetBrains Mono, petrol/zand-palet) |
| `BACKEND.md` | Backend-architectuur, alle endpoints, env-vars |
| `supabase/README.md` | Migraties, push-flow, integratie-credentials, eerste admin |
| `.env.example` | Env-vars met uitleg |

## Vestiging
Het Schild 35, 5275 EE Den Dungen. 06-27172876, info@wittenboerevents.nl.

## Hoe je communiceert
- Vraag niet "weet je het zeker?" voor elke kleine actie. Begin gewoon.
- Bij dubbelzinnigheid: kies het meest waarschijnlijke en zeg het.
- Houd antwoorden kort. Code/diff > uitleg.
- Bij blokkers (key ontbreekt, Supabase niet gelinkt): zeg het in 1 regel en geef het exacte commando dat Chris moet draaien.
