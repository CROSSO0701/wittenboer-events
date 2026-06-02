'use client';

import { motion, useReducedMotion } from 'motion/react';

type ChannelTone = 'light' | 'dark';

interface ChannelListProps {
  /** Werkt op licht (default) of donker oppervlak. */
  tone?: ChannelTone;
}

interface Channel {
  bron: string;
  niveau: string;
}

// Wittenboer-diensten als AV-patch: kanaal-naam, bron-omschrijving, niveau-indicatie.
const CHANNELS: Array<{ naam: string } & Channel> = [
  { naam: 'Licht', bron: 'Beweegbaar, wash & spot', niveau: 'FULL' },
  { naam: 'Geluid', bron: 'Line-array & monitoring', niveau: '+6 dB' },
  { naam: 'Podium', bron: 'Modulair, elke maat', niveau: '0–1.0 m' },
  { naam: 'Truss / Rigging', bron: 'Ground support & hang', niveau: 'GEKEURD' },
  { naam: 'Stroom', bron: 'Verdeling & aggregaat', niveau: '3×63 A' },
  { naam: 'Crew', bron: 'Op- en afbouw, van A tot Z', niveau: 'STAND-BY' },
];

const PALETTE: Record<
  ChannelTone,
  {
    bg: string;
    headBg: string;
    border: string;
    fg: string;
    muted: string;
    num: string;
    accent: string;
  }
> = {
  light: {
    bg: 'var(--color-card)',
    headBg: 'var(--color-surface-1)',
    border: 'var(--color-border)',
    fg: 'var(--color-fg)',
    muted: 'var(--color-fg-muted)',
    num: 'var(--color-primary)',
    accent: 'var(--color-primary)',
  },
  dark: {
    bg: 'var(--color-surface-dark)',
    headBg: 'var(--color-surface-dark-1)',
    border: 'var(--color-border-on-dark)',
    fg: 'var(--color-fg-on-dark)',
    muted: 'var(--color-fg-on-dark-muted)',
    num: 'var(--color-tertiary)',
    accent: 'var(--color-tertiary)',
  },
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function ChannelList({ tone = 'light' }: ChannelListProps) {
  const p = PALETTE[tone];
  const reduce = useReducedMotion();

  return (
    <div
      className="w-full overflow-hidden rounded-[var(--radius-lg)]"
      style={{ background: p.bg, border: `1px solid ${p.border}` }}
    >
      {/* Header-rij als een echte patchsheet. */}
      <div
        className="grid grid-cols-[3.25rem_1fr_5.5rem] items-center gap-3 px-4 py-2.5 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em]"
        style={{ background: p.headBg, color: p.muted }}
      >
        <span>Kanaal</span>
        <span>Bron</span>
        <span className="text-right">Niveau</span>
      </div>

      <ul className="m-0 list-none p-0">
        {CHANNELS.map((ch, i) => (
          <motion.li
            key={ch.naam}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
            className="grid grid-cols-[3.25rem_1fr_5.5rem] items-center gap-3 px-4 py-3"
            style={{
              borderTop: i === 0 ? 'none' : `1px solid ${p.border}`,
            }}
          >
            {/* Genummerd kanaal: 01, 02, … in mono. */}
            <span
              className="font-[family-name:var(--font-mono)] text-[0.95rem] tabular-nums tracking-[0.05em]"
              style={{ color: p.num }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            <span className="min-w-0">
              <span
                className="block font-[family-name:var(--font-display)] text-[1.05rem] uppercase leading-none tracking-[0.01em]"
                style={{ color: p.fg }}
              >
                {ch.naam}
              </span>
              <span
                className="mt-1 block truncate text-[0.78rem]"
                style={{ color: p.muted }}
              >
                {ch.bron}
              </span>
            </span>

            {/* Niveau-indicatie + signaal-stip. */}
            <span className="flex items-center justify-end gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: p.accent }}
              />
              <span
                className="font-[family-name:var(--font-mono)] text-[0.7rem] uppercase tracking-[0.12em] tabular-nums"
                style={{ color: p.fg }}
              >
                {ch.niveau}
              </span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
