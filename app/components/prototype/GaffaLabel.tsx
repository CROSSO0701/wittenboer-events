import type { ReactNode } from 'react';

type GaffaTone = 'dark' | 'teal' | 'sand';

interface GaffaLabelProps {
  /** Tekst of inhoud op de tape. */
  children: ReactNode;
  /** Kleur van de tape. 'dark' = backstage-zwart (default). */
  tone?: GaffaTone;
}

/**
 * Mat strookje gaffa-tape met handgescheurde randen — herbruikbaar als chip/tag.
 * De randen worden gemaakt met een lichte clip-path en de doek-textuur met
 * gestreepte lineaire gradients. Géén interactie, dus geen 'use client'.
 */

const TONE: Record<
  GaffaTone,
  { base: string; weave: string; fg: string; edge: string }
> = {
  dark: {
    base: 'var(--color-surface-dark)',
    weave: 'var(--color-surface-dark-1)',
    fg: 'var(--color-fg-on-dark)',
    edge: 'var(--color-secondary-deep)',
  },
  teal: {
    base: 'var(--color-primary)',
    weave: 'var(--color-primary-deep)',
    fg: 'var(--color-fg-on-dark)',
    edge: 'var(--color-primary-deep)',
  },
  sand: {
    base: 'var(--color-tertiary)',
    weave: 'var(--color-tertiary-deep)',
    fg: 'var(--color-fg)',
    edge: 'var(--color-tertiary-deep)',
  },
};

// Hand-gescheurde randen: onregelmatige polygon links én rechts.
const TORN_EDGE =
  'polygon(2% 12%, 4% 0%, 9% 9%, 16% 1%, 24% 8%, 33% 2%, 44% 9%, 55% 1%, 66% 8%, 77% 2%, 88% 9%, 95% 1%, 98% 11%, 99% 50%, 98% 88%, 95% 99%, 88% 91%, 77% 98%, 66% 92%, 55% 99%, 44% 91%, 33% 98%, 24% 92%, 16% 99%, 9% 91%, 4% 100%, 2% 88%, 1% 50%)';

export function GaffaLabel({ children, tone = 'dark' }: GaffaLabelProps) {
  const t = TONE[tone];

  return (
    <span
      className="relative inline-flex select-none items-center font-[family-name:var(--font-mono)] text-[0.7rem] font-medium uppercase leading-none tracking-[0.14em]"
      style={{
        color: t.fg,
        padding: '0.42em 0.85em',
        transform: 'rotate(-2deg)',
        clipPath: TORN_EDGE,
        // Mat doek: basiskleur + fijne diagonale weave + subtiel verticaal verloop.
        backgroundColor: t.base,
        backgroundImage: [
          `repeating-linear-gradient(45deg, ${t.weave} 0 1px, transparent 1px 4px)`,
          `repeating-linear-gradient(-45deg, ${t.weave} 0 1px, transparent 1px 5px)`,
          `linear-gradient(180deg, color-mix(in oklab, ${t.base} 88%, #fff) 0%, ${t.base} 45%, ${t.weave} 100%)`,
        ].join(', '),
        backgroundBlendMode: 'soft-light, soft-light, normal',
        boxShadow: `0 1px 0 ${t.edge}, 0 4px 10px -6px rgb(0 0 0 / 0.45)`,
      }}
    >
      {/* Mat-folie highlight bovenrand, heel subtiel. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: TORN_EDGE,
          background:
            'linear-gradient(180deg, rgb(255 255 255 / 0.12) 0%, transparent 28%)',
        }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}
