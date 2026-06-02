'use client';

import Image from 'next/image';
import {
  motion,
  useReducedMotion,
  type Variants,
  type Transition,
} from 'motion/react';

/**
 * Gedeelde easing van de huisstijl — rustig, doelgericht, geen overshoot.
 */
const EASE: Transition['ease'] = [0.16, 1, 0.3, 1];

/**
 * ShowDossier — een editorial 'productie-dossier' / case-study voor één project.
 *
 * Leest als een echt draaiboek / technische rider (call sheet, line-up, techniek,
 * crew), maar dan rustig en stijlvol vormgegeven met veel whitespace. Alle data is
 * fictief-maar-plausibel voor een Wittenboer-project in Brabant.
 *
 * Animatie: subtiele in-view reveals (opacity + kleine y, gestaggerd). Bij
 * prefers-reduced-motion verschijnt alles direct in eindtoestand.
 */

// ── Reveal-variants ──────────────────────────────────────────────────────────

const sectionStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// ── Fictieve dossier-content ─────────────────────────────────────────────────

const META = [
  { label: 'Datum', value: '21 juni 2025' },
  { label: 'Locatie', value: 'Marktplein, Lievendonk (NB)' },
  { label: 'Capaciteit', value: '2.400 bezoekers' },
  { label: 'Duur', value: '14:00 – 01:00' },
] as const;

interface CallSheetRow {
  time: string;
  what: string;
  detail: string;
}

const GET_IN: CallSheetRow[] = [
  { time: '07:30', what: 'Aankomst trucks', detail: 'Twee bakwagens — laden via Kerkstraat-zijde' },
  { time: '08:00', what: 'Podiumopbouw', detail: 'Dak en truss eerst, daarna deck' },
  { time: '11:30', what: 'Rigging licht & geluid', detail: 'Hang klaar voor focus' },
  { time: '14:30', what: 'Soundcheck', detail: 'Per act, in omgekeerde line-up-volgorde' },
];

interface LineUpRow {
  slot: string;
  act: string;
  note: string;
}

const LINE_UP: LineUpRow[] = [
  { slot: '15:00', act: 'Fanfare De Eendracht', note: 'Akoestisch — twee handmics' },
  { slot: '17:30', act: 'Coverband Zandloper', note: 'Full backline, eigen monitoring' },
  { slot: '20:00', act: 'DJ Wenders', note: 'CDJ-set, overgang naar avondblok' },
  { slot: '22:00', act: 'Tribute-act Bandwerk', note: 'Headliner — volledige show-cue' },
];

interface SpecGroup {
  label: string;
  specs: string[];
}

const TECHNIEK: SpecGroup[] = [
  {
    label: 'Licht',
    specs: [
      'Wash + spots, 48 kanalen',
      '12× moving head op de truss',
      'Front-truss met 6× warmwitte blinders',
      'Hazer + sturing via grandMA-console',
    ],
  },
  {
    label: 'Geluid',
    specs: [
      'Line-array L/R + 4× sub',
      'Front-of-house: 32-kanaals digitaal mengpaneel',
      'Monitoring: 4× wedge + 2× in-ear-stations',
      'Geluidsmeting conform vergunning (≤ 95 dB(A))',
    ],
  },
  {
    label: 'Podium',
    specs: [
      'Podium 10×6 m, 60 cm hoog',
      'Overkapping met zij- en achterwanden',
      'Trap + hellingbaan, antislip dekvloer',
      'Aparte backline-riser 4×2 m',
    ],
  },
];

interface CrewRow {
  role: string;
  count: string;
  detail: string;
}

const CREW: CrewRow[] = [
  { role: 'Productieleider', count: '1', detail: 'Aanspreekpunt op locatie, van A tot Z' },
  { role: 'Licht-operator', count: '1', detail: 'Programmering + live-sturing' },
  { role: 'Geluidstechnicus', count: '2', detail: 'FOH en monitoring' },
  { role: 'Podiumcrew', count: '4', detail: 'Op- en afbouw, stagehands tijdens show' },
  { role: 'Veiligheidscoördinator', count: '1', detail: 'Vergunning, EHBO-afstemming' },
];

// ── Subcomponenten ───────────────────────────────────────────────────────────

/**
 * Genummerd sectiekopje in call-sheet-stijl: mono-volgnummer + Anton-label.
 */
function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <motion.div variants={riseIn} className="flex items-baseline gap-[1ch]">
      <span
        className="font-[family-name:var(--font-mono)] text-sm tabular-nums"
        style={{ color: 'var(--color-primary)' }}
      >
        {index}
      </span>
      <h2
        className="font-[family-name:var(--font-display)] text-3xl uppercase leading-none tracking-tight sm:text-4xl"
        style={{ color: 'var(--color-fg)' }}
      >
        {title}
      </h2>
    </motion.div>
  );
}

/**
 * Sectie-wrapper met in-view stagger en een dunne bovenrand als register-lijn.
 */
function DossierSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={sectionStagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="border-t pt-8 sm:pt-10"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <SectionHeading index={index} title={title} />
      <div className="mt-7">{children}</div>
    </motion.section>
  );
}

// ── Hoofdcomponent ───────────────────────────────────────────────────────────

export function ShowDossier() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? 'show' : 'hidden';

  return (
    <article
      className="mx-auto max-w-5xl px-6 py-20 sm:px-10 lg:py-28"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-fg)' }}
    >
      {/* ── Kop ── */}
      <motion.header
        variants={sectionStagger}
        initial={initial}
        animate="show"
      >
        <motion.p
          variants={riseIn}
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Productie-dossier — Dossier №&nbsp;084
        </motion.p>

        <motion.h1
          variants={riseIn}
          className="mt-5 font-[family-name:var(--font-display)] text-5xl uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl"
          style={{ color: 'var(--color-fg)' }}
        >
          Dorpsfeest
          <br />
          Lievendonk
        </motion.h1>

        <motion.p
          variants={riseIn}
          className="mt-6 max-w-xl text-lg leading-relaxed"
          style={{ color: 'var(--color-fg-secondary)' }}
        >
          Een volledig verzorgd buitenpodium voor het jaarlijkse dorpsfeest:
          licht, geluid en podium van opbouw tot afbouw. Eén draaiboek, één
          aanspreekpunt — wij regelden het van A tot Z.
        </motion.p>

        {/* Meta-rij */}
        <motion.dl
          variants={riseIn}
          className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-y py-6 sm:grid-cols-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {META.map((m) => (
            <div key={m.label}>
              <dt
                className="font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-[0.2em]"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                {m.label}
              </dt>
              <dd
                className="mt-1.5 font-[family-name:var(--font-mono)] text-sm"
                style={{ color: 'var(--color-fg)' }}
              >
                {m.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.header>

      {/* ── Hoofdfoto ── */}
      <motion.figure
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mt-12 aspect-[16/9] overflow-hidden rounded-sm"
        style={{ backgroundColor: 'var(--color-surface-dark)' }}
      >
        <Image
          src="/photos/project-megapark.jpg"
          alt="Verlicht buitenpodium tijdens het dorpsfeest in Lievendonk"
          fill
          sizes="(min-width: 1024px) 64rem, 100vw"
          className="object-cover"
          priority={false}
        />
        <figcaption
          className="absolute bottom-0 left-0 right-0 p-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]"
          style={{
            color: 'var(--color-fg-on-dark)',
            background:
              'linear-gradient(to top, color-mix(in oklch, var(--color-surface-dark) 80%, transparent), transparent)',
          }}
        >
          Hoofdpodium — avondblok
        </figcaption>
      </motion.figure>

      {/* ── Secties ── */}
      <div className="mt-16 space-y-16">
        {/* GET-IN */}
        <DossierSection index="01" title="Get-in">
          <ol className="space-y-px">
            {GET_IN.map((row) => (
              <motion.li
                key={row.time}
                variants={riseIn}
                className="grid grid-cols-[5ch_1fr] items-baseline gap-x-5 gap-y-1 py-3 sm:grid-cols-[6ch_14rem_1fr]"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="font-[family-name:var(--font-mono)] text-sm tabular-nums"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {row.time}
                </span>
                <span className="text-base font-medium" style={{ color: 'var(--color-fg)' }}>
                  {row.what}
                </span>
                <span
                  className="col-span-2 text-sm sm:col-span-1"
                  style={{ color: 'var(--color-fg-secondary)' }}
                >
                  {row.detail}
                </span>
              </motion.li>
            ))}
          </ol>
        </DossierSection>

        {/* LINE-UP */}
        <DossierSection index="02" title="Line-up">
          <ol className="space-y-px">
            {LINE_UP.map((row) => (
              <motion.li
                key={row.slot}
                variants={riseIn}
                className="grid grid-cols-[5ch_1fr] items-baseline gap-x-5 gap-y-1 py-3 sm:grid-cols-[6ch_1fr_auto]"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="font-[family-name:var(--font-mono)] text-sm tabular-nums"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {row.slot}
                </span>
                <span
                  className="font-[family-name:var(--font-display)] text-xl uppercase leading-none tracking-tight"
                  style={{ color: 'var(--color-fg)' }}
                >
                  {row.act}
                </span>
                <span
                  className="col-span-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.15em] sm:col-span-1 sm:text-right"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  {row.note}
                </span>
              </motion.li>
            ))}
          </ol>
        </DossierSection>

        {/* TECHNIEK */}
        <DossierSection index="03" title="Techniek">
          <div className="grid gap-px sm:grid-cols-3">
            {TECHNIEK.map((group) => (
              <motion.div
                key={group.label}
                variants={riseIn}
                className="p-6"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <h3
                  className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em]"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {group.label}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.specs.map((spec) => (
                    <li
                      key={spec}
                      className="flex gap-3 text-sm leading-snug"
                      style={{ color: 'var(--color-fg-secondary)' }}
                    >
                      <span
                        aria-hidden
                        className="mt-[0.55em] h-px w-3 shrink-0"
                        style={{ backgroundColor: 'var(--color-tertiary-deep)' }}
                      />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Tweede foto, verweven na de specs */}
          <motion.figure
            variants={riseIn}
            className="relative mt-10 aspect-[21/9] overflow-hidden rounded-sm"
            style={{ backgroundColor: 'var(--color-surface-dark)' }}
          >
            <Image
              src="/photos/event-5.jpg"
              alt="Truss met moving heads en line-array tijdens de soundcheck"
              fill
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="object-cover"
            />
          </motion.figure>
        </DossierSection>

        {/* CREW */}
        <DossierSection index="04" title="Crew">
          <ol className="space-y-px">
            {CREW.map((row) => (
              <motion.li
                key={row.role}
                variants={riseIn}
                className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 gap-y-1 py-3 sm:grid-cols-[14rem_3ch_1fr]"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span className="text-base font-medium" style={{ color: 'var(--color-fg)' }}>
                  {row.role}
                </span>
                <span
                  className="font-[family-name:var(--font-mono)] text-sm tabular-nums sm:text-right"
                  style={{ color: 'var(--color-primary)' }}
                >
                  ×{row.count}
                </span>
                <span
                  className="col-span-2 text-sm sm:col-span-1"
                  style={{ color: 'var(--color-fg-secondary)' }}
                >
                  {row.detail}
                </span>
              </motion.li>
            ))}
          </ol>
        </DossierSection>
      </div>

      {/* ── Afsluiting ── */}
      <motion.footer
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mt-20 border-t pt-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-fg-muted)',
        }}
      >
        Wittenboer Events — productie van A tot Z · Dossier afgesloten 22 juni 2025
      </motion.footer>
    </article>
  );
}
