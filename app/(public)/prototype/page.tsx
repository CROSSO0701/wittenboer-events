import type { Metadata } from 'next'
import { SpotlightCursor } from '../../components/prototype/SpotlightCursor'
import { StageHaze } from '../../components/prototype/StageHaze'
import { HeroPowerUp } from '../../components/prototype/HeroPowerUp'
import { KineticHeadline } from '../../components/prototype/KineticHeadline'
import { GaffaLabel } from '../../components/prototype/GaffaLabel'
import { LaminatePass } from '../../components/prototype/LaminatePass'
import { ChannelList } from '../../components/prototype/ChannelList'
import { FlightcaseCard } from '../../components/prototype/FlightcaseCard'
import { GelImage } from '../../components/prototype/GelImage'
import { PatchCable } from '../../components/prototype/PatchCable'
import { VenueTicker } from '../../components/prototype/VenueTicker'
import { ShowDossier } from '../../components/prototype/ShowDossier'

export const metadata: Metadata = { title: 'Prototype — Backstage Craft', robots: { index: false } }

// Klein bijschrift boven elk blok zodat duidelijk is wát je ziet.
function Caption({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-baseline gap-x-3 gap-y-1 px-6">
      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-primary)]">{n}</span>
      <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-[var(--color-fg)]">
        {title}
      </h2>
      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)]">{note}</span>
    </div>
  )
}

export default function PrototypePage() {
  return (
    <main className="bg-[var(--color-bg)]">
      {/* Volgspot volgt de muis over de hele pagina (mooist op de donkere blokken) */}
      <SpotlightCursor tone="warm" />

      <header className="border-b border-[var(--color-border)] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3">
            <GaffaLabel tone="teal">Prototype</GaffaLabel>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-wide text-[var(--color-fg)] sm:text-5xl">
            Backstage Craft — alle elementen
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-fg-secondary)]">
            Een showcase van de voorgestelde design-elementen, in de échte huisstijl (petrol, warm zand,
            donker leisteen). Beweeg je muis over de donkere blokken voor de volgspot. Kies straks wat
            mee mag naar de live site.
          </p>
        </div>
      </header>

      {/* 01 — Power-up hero */}
      <section className="py-4">
        <Caption n="01" title="Power-up hero" note="licht gaat aan bij het laden" />
        <HeroPowerUp />
      </section>

      {/* 02 — Kinetische kop */}
      <section className="py-20">
        <Caption n="02" title="Kinetische kop" note="woord wisselt: licht → geluid → podium → crew" />
        <div className="mx-auto max-w-5xl px-6">
          <KineticHeadline />
        </div>
      </section>

      {/* 03 — Stage haze + lichtschachten */}
      <section className="py-20">
        <Caption n="03" title="Stage haze" note="volumetrische lichtschachten op donker" />
        <div className="relative mx-auto flex max-w-5xl items-center justify-center overflow-hidden rounded-3xl bg-[var(--color-surface-dark)] px-6 py-24">
          <StageHaze />
          <p className="relative z-10 max-w-md text-center text-lg text-[var(--color-fg-on-dark)]">
            Sfeer als op de vloer: haze die de beams vangt, warm licht van boven.
          </p>
        </div>
      </section>

      {/* 04 — Color-gel hover op beeld */}
      <section className="py-20">
        <Caption n="04" title="Color-gel beeld" note="grijs → warme gel in beeld / bij hover" />
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-6 sm:grid-cols-3">
          <GelImage src="/photos/event-1.jpg" alt="Evenement" gel="warm" />
          <GelImage src="/photos/event-2.jpg" alt="Podium" gel="teal" />
          <GelImage src="/photos/event-5.jpg" alt="Licht" gel="warm" />
        </div>
      </section>

      {/* 05 — Flightcase-cards */}
      <section className="py-20">
        <Caption n="05" title="Flightcase-cards" note="roadcase met latch die klikt op hover" />
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
          <FlightcaseCard title="Compact" subtitle="Licht + geluid, kant-en-klaar" image="/photos/park-lounge-2.jpg" />
          <FlightcaseCard title="Truss-show" subtitle="Podium, truss & rigging" image="/photos/project-megapark.jpg" />
          <FlightcaseCard title="Full Production" subtitle="Van A tot Z, incl. crew" image="/photos/project-park-lounge.jpg" />
        </div>
      </section>

      {/* 06 — Channel list / patchsheet */}
      <section className="py-20">
        <Caption n="06" title="Patchlijst" note="diensten als een AV-kanaallijst" />
        <div className="mx-auto max-w-5xl px-6">
          <ChannelList tone="light" />
        </div>
      </section>

      {/* 07 — Craft-labels: gaffa + laminate */}
      <section className="py-20">
        <Caption n="07" title="Craft-labels" note="gaffa-tape tags + backstage-pas" />
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6">
          <GaffaLabel tone="dark">Licht</GaffaLabel>
          <GaffaLabel tone="teal">Geluid</GaffaLabel>
          <GaffaLabel tone="sand">Podium</GaffaLabel>
          <GaffaLabel tone="dark">Crew</GaffaLabel>
          <div className="ml-auto">
            <LaminatePass name="Wittenboer Crew" role="AAA" event="Dorpsfeest Lievendonk" date="12-07-2026" />
          </div>
        </div>
      </section>

      {/* 08 — Patchkabel die zich uittekent */}
      <section className="py-12">
        <Caption n="08" title="Patchkabel" note="tekent zich uit op scroll, verbindt secties" />
        <div className="flex justify-center">
          <PatchCable height={200} />
        </div>
      </section>

      {/* 09 — Venue-ticker (LED) */}
      <section className="py-20">
        <Caption n="09" title="Venue-ticker" note="LED dot-matrix marquee" />
        <div className="mx-auto max-w-5xl px-6">
          <VenueTicker />
        </div>
      </section>

      {/* 10 — Showdossier */}
      <section className="py-20">
        <Caption n="10" title="Showdossier" note="project als productie-draaiboek" />
        <ShowDossier />
      </section>

      <footer className="border-t border-[var(--color-border)] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)]">
            // einde prototype — zeg welke elementen mee mogen naar de live site.
          </p>
        </div>
      </footer>
    </main>
  )
}
