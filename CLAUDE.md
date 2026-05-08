# Claude Code briefing — Wittenboer Events

## Wat dit is
Editorial-redesign van wittenboerevents.nl: licht/geluid/podia + show-pakket-verhuur, met booking-backend voor artiesten en admin. Frontend wordt door Claude Design (web app) per groep aangeleverd; backend is hier al gebouwd als blueprint. Jij (Claude Code) bouwt door waar de blueprint stopt en helpt met merging, debugging en deploy.

## Stack — niet aanpassen zonder overleg
- Next.js 16.2.1 App Router + Turbopack
- React 19, TypeScript strict
- Tailwind CSS v4 (CSS-first, géén `tailwind.config.js`)
- Motion library — import altijd uit `motion/react` (niet `framer-motion`)
- Supabase (Postgres + Auth + SSR cookies)
- Forms: react-hook-form + Zod 4
- Mail: Resend (via fetch in `app/lib/integrations/resend.ts` — geen `resend` package gebruiken)
- Hosting: Vercel (project `wittenboer-nextjs` is al gelinkt — zie `.vercel/project.json`)
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

## Wat klaar is
- **Groep 1 frontend**: Hero met split-text, ApproachStrip line-draw, FeaturedWork parallax, ContactCTA, TrustedBy marquee, ServicesPreview hover-lift, over-ons met count-up, page-transitions, Sonner toaster, shadcn-stijl Button. TypeScript clean.
- **Backend volledig blueprint**: schema, RLS, seed, types, Zod-schemas, auth-helpers, integraties, mail-templates, alle API-routes. Compileert clean. Faalt netjes zonder credentials.

## Wat openstaat — in volgorde van prioriteit
1. **Lokaal draaien** en groep 1 visueel reviewen — eerste taak.
2. **`.env.local` invullen** uit `.env.example` zodra Chris de Supabase-keys/Resend-keys/Google OAuth aanlevert.
3. **Supabase migrations pushen**: `pnpm dlx supabase login && pnpm dlx supabase link --project-ref <ref> && pnpm dlx supabase db push`.
4. **Types genereren**: `pnpm dlx supabase gen types typescript --local > app/lib/db/types.generated.ts`. Daarna in `app/lib/db/{client,server}.ts` `<Database>` generic terugzetten op `createBrowserClient`/`createSSRClient`/`createSupabaseClient`.
5. **Show-pakketten frontend** — Claude Design moet `app/show-pakketten/page.tsx` + `[slug]/page.tsx` + `app/lib/content/packages.ts` toevoegen, plus menu-item "Show pakketten" in `app/components/layout/nav-links.ts`. Foto's komen in `public/photos/show-packages/{compact,booth,truss-show,show-wit}.jpg` (Higgsfield-output, apart traject).
6. **ContactForm switchen** van `/api/contact` naar `/api/inquiry` met `type: 'contact'` body. Daarna `app/api/contact/route.ts` schrappen.
7. **Vercel cron** — `vercel.json` met `{ "crons": [{ "path": "/api/cron/artwinlive-sync", "schedule": "*/15 * * * *" }] }`.
8. **proxy.ts** in repo-root voor Supabase auth-cookie-refresh (nodig voor `/portal/*` routes).
9. **`/api/oauth/google/callback`** route schrijven om Google Calendar refresh-token op te halen na Marnix' OAuth-consent.
10. **Database-trigger** voor `profiles`-rij bij nieuwe `auth.users`. Eerste admin handmatig promoveren via SQL editor.
11. **Portals**: `/portal/login` (magic-link), `/portal/artiest`, `/portal/admin` — komt als Design's groep portals.
12. **Brochure-PDF** voor de 4 show-pakketten — A4 downloadbaar op `/show-pakketten`.

## Niet aanraken
- `app/lib/db/`, `app/lib/schemas/`, `app/lib/auth/`, `app/lib/integrations/`, `app/lib/email/`, `app/api/inquiry/`, `app/api/bookings/`, `app/api/cron/`, `app/api/portal/`, `supabase/` — backend-blueprint, gemerged, hands-off behalve type-regen + bugfix.
- `app/components/shared/MagneticButton.tsx` — deprecation-shim, blijft staan tot iemand `git rm` doet.
- `package.json` deps zonder reden — alle benodigde deps staan er. Vraag bij twijfel.

## Hard verboden (uit DESIGN.md)
- Inter / Fraunces / IBM Plex / Playfair / Cormorant / Outfit
- `bg-#000` / `bg-#fff` (gebruik OKLCH-tokens uit `globals.css`)
- Paarse/indigo gradients
- `h-screen` op hero (gebruik `min-h-[100dvh]`)
- 3-kolom equal feature-cards
- Bounce/elastic/overshoot easing
- "Lorem Ipsum", "John Doe", "99.99%"
- Emoji in UI chrome

## Tone of voice (NL)
Formeel "u". Marnix-stijl: *ontzorgen, meedenken, van A tot Z*. Geen marketing-speak.

## Reference docs
| File | Voor |
|---|---|
| `DESIGN.md` | Design-direction (Backstage Craft, Darker Grotesque, OKLCH amber) |
| `BACKEND.md` | Backend-architectuur, alle endpoints, env-vars |
| `supabase/README.md` | Supabase CLI commands |
| `.env.example` | Env-vars met uitleg |

## Hoe je communiceert
- Vraag niet "weet je het zeker?" voor elke kleine actie. Begin gewoon.
- Bij dubbelzinnigheid: kies het meest waarschijnlijke en zeg het.
- Houd antwoorden kort. Code/diff > uitleg.
- Bij blokkers (key ontbreekt, Supabase niet gelinkt): zeg het in 1 regel en geef het exacte commando dat Chris moet draaien.
