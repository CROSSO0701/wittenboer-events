'use client';

import { motion, useReducedMotion } from 'motion/react';

interface VenueTickerProps {
  /**
   * De namen die over het bord lopen. Default: een plausibele NL-lijst met
   * fictieve venues en events uit de licht/geluid/podium-wereld.
   */
  items?: string[];
}

const DEFAULT_ITEMS = [
  'Zomerfeest De Maashorst',
  'Theater Markant — Najaarsgala',
  'Strandtent De Kaap',
  'Bedrijfsfeest Van Loon B.V.',
  'Stadsfestival Lichtkroon',
  'Bruiloft Hoeve Ravenstein',
  'Sporthal De Voorde — Slotavond',
  'Kermis Grote Markt',
];

const EASE_LINEAR: [number, number, number, number] = [0, 0, 1, 1];

/**
 * Marquee in clubbord-/LED-dot-matrix-stijl: doorlopend scrollende namen in
 * mono-hoofdletters met een teal LED-gloed, op een donker paneel met een
 * subtiel dot-raster op de achtergrond. De lijst wordt verdubbeld zodat de
 * lus naadloos doorloopt.
 *
 * Bij prefers-reduced-motion staat de rij stil (geen scroll).
 */
export function VenueTicker({ items = DEFAULT_ITEMS }: VenueTickerProps) {
  const prefersReducedMotion = useReducedMotion();

  // Verdubbel de lijst: animatie loopt over exact -50% en kan dan resetten
  // zonder zichtbare sprong.
  const loop = [...items, ...items];

  return (
    <div
      className="relative w-full overflow-hidden border-y py-4"
      style={{
        background: 'var(--color-surface-dark)',
        borderColor: 'var(--color-surface-dark-1)',
        // Subtiel LED dot-matrix-raster.
        backgroundImage:
          'radial-gradient(circle, color-mix(in oklch, var(--color-primary) 22%, transparent) 1px, transparent 1px)',
        backgroundSize: '10px 10px',
      }}
    >
      {/* Fade-randen links/rechts voor een 'inschuivend' bord-gevoel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(90deg, var(--color-surface-dark) 0%, transparent 8%, transparent 92%, var(--color-surface-dark) 100%)',
        }}
      />

      <motion.div
        className="flex w-max items-center whitespace-nowrap"
        animate={prefersReducedMotion ? undefined : { x: ['0%', '-50%'] }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 28, ease: EASE_LINEAR, repeat: Infinity }
        }
      >
        {loop.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="flex items-center"
            style={{
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--color-tertiary)',
              // LED-gloed: warme kern + teal halo.
              textShadow:
                '0 0 2px color-mix(in oklch, var(--color-tertiary) 80%, transparent), 0 0 12px color-mix(in oklch, var(--color-primary) 70%, transparent)',
            }}
          >
            <span className="px-7">{label}</span>
            <span
              aria-hidden="true"
              style={{
                color: 'var(--color-primary)',
                textShadow:
                  '0 0 8px color-mix(in oklch, var(--color-primary) 80%, transparent)',
              }}
            >
              &bull;
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
