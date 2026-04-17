# Wittenboer Events — Backstage Craft

Claude-built version of the Wittenboer Events redesign. Built for side-by-side comparison with the Hermes-built version.

**Taste direction**: light interface with cinematic dark photo inserts, Darker Grotesque + Sometype Mono, single amber accent, magazine-spread layouts.

Read `DESIGN.md` for the full taste rationale and anti-pattern ban list.
Read `.impeccable.md` for the Design Context (user, brand, principles).

---

## Tech stack

- Next.js 16.2.1 (App Router, Turbopack stable, React Compiler stable)
- React 19
- Tailwind CSS v4.1 (CSS-first config via `@theme` in `app/globals.css`)
- Motion library (`motion/react` — formerly framer-motion)
- TypeScript strict mode

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Expected first-install time: ~30s for deps, ~5s for first Turbopack build.

## Deploy to Vercel

One-time setup:

1. Push this folder as its own repo on GitHub (see commands below)
2. Go to https://vercel.com/new
3. Import the GitHub repo
4. Click Deploy (no env vars required)

After that, `git push` on any branch creates a preview deploy automatically. `git push` to `main` deploys to production.

### First push

From this folder:

```bash
git init
git add .
git commit -m "Initial: Wittenboer Events redesign (Claude version)"
gh repo create wittenboer-stage --public --source=. --push
```

If you don't have the `gh` CLI, create the repo on GitHub.com first and:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wittenboer-stage.git
git branch -M main
git push -u origin main
```

### Iteration workflow

- Branch per iteration: `git checkout -b iter-02`
- Push: `git push -u origin iter-02`
- Vercel creates `wittenboer-stage-iter-02-YOUR_USERNAME.vercel.app` automatically
- Open on mobile first (this is a mobile-first site — judge it there)
- Merge to main when approved

## Swapping in real Wittenboer assets

The current build points to Wittenboer's existing WordPress-hosted images. That works during migration. For a faster and more controlled final site, move photos into `/public/photos`:

1. Download the 6 real Wittenboer photos from `wittenboerevents.nl/wp-content/uploads/2022/06/`
2. Save as `/public/photos/hero.jpg`, `/public/photos/work-01.jpg`, etc.
3. Replace the Image `src` paths in `Hero.tsx`, `Work.tsx`, `Contact.tsx`
4. Remove the `remotePatterns` entry in `next.config.ts` for `wittenboerevents.nl`
5. Add real Marnix portrait at `/public/photos/marnix.jpg` (currently a picsum placeholder in `About.tsx`)

Once moved, Next 16 will auto-optimize, generate responsive srcsets, and serve AVIF / WebP via Vercel Image.

## File structure

```
.
├── .impeccable.md              ← Design Context (users, brand, principles)
├── DESIGN.md                   ← Taste rationale, anti-pattern ban list
├── README.md                   ← this file
├── app/
│   ├── globals.css             ← Tailwind v4 @theme + OKLCH design tokens
│   ├── layout.tsx              ← Fonts, metadata, root html
│   ├── page.tsx                ← Composition of all sections
│   └── components/
│       ├── Nav.tsx             ← Fixed top nav, subtle bg on scroll
│       ├── Hero.tsx            ← 60/40 split, type left + cinematic photo right
│       ├── Services.tsx        ← 5 services, zig-zag rows, no cards
│       ├── Work.tsx            ← Dark cinematic photo strip, 3 asymmetric frames
│       ├── About.tsx           ← Marnix + how-we-work table (hairline rows)
│       ├── Testimonials.tsx    ← Pull-quotes with attribution, not carousel
│       ├── Contact.tsx         ← 60/40 channel list + backstage photo
│       └── Footer.tsx          ← Minimal tri-column
├── public/
│   └── photos/                 ← Real Wittenboer assets go here
├── package.json
├── tsconfig.json
├── next.config.ts              ← React Compiler on, image remotePatterns
├── postcss.config.mjs          ← @tailwindcss/postcss (v4)
├── next-env.d.ts
└── .gitignore
```

## Quality targets

| Metric | Target |
|---|---|
| Lighthouse Performance (mobile) | ≥ 95 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | ≥ 95 |
| Lighthouse SEO | 100 |
| Largest Contentful Paint (mobile 4G) | ≤ 1.8s |
| Cumulative Layout Shift | ≤ 0.05 |
| Total Blocking Time | ≤ 100ms |

Run Lighthouse:

```bash
npm run build
npm run start
# in another terminal:
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view  # mobile is default
```

## Anti-pattern audit (recommended before every merge)

```bash
# Impeccable's own detector — catches 24+ AI slop patterns
npx impeccable detect http://localhost:3000
# target: 0 issues
```

If Impeccable reports anything, fix it. The ban list in DESIGN.md aligns with what the detector enforces.

## Comparing with Hermes's version

After both sites are deployed as Vercel previews, run both through the same gauntlet:

1. Open each on mobile first — judge on feel, not features
2. Run both through Lighthouse mobile — compare numbers
3. Run both through `npx impeccable detect` — compare issue counts
4. Show both to a non-technical friend for 10 seconds each, close tab, ask what they remember

The winner is the one that is:
- More memorable after 10s exposure
- Lower on Impeccable issue count  
- Higher on Lighthouse mobile
- Faster to trust ("this company can handle my event")

Ship the winner. Or better: combine the strongest parts of both.
