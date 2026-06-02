'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

interface PatchCableProps {
  /**
   * Totale hoogte van het kabel-motief in pixels. Bepaalt de lengte van het
   * verticale verbindingsstuk. Default ~160.
   */
  height?: number;
}

/**
 * Decoratief SVG-motief: een patchkabel met jack-connectoren aan beide
 * uiteinden en een rustig gebogen kabelstuk ertussen. De kabel tekent zichzelf
 * van boven naar onderen uit terwijl de gebruiker scrollt (pathLength via
 * useScroll). Bedoeld als verticaal verbindingselement tussen twee secties:
 * zet 'm gecentreerd tussen twee blokken.
 *
 * Bij prefers-reduced-motion wordt de kabel direct volledig getekend.
 */
export function PatchCable({ height = 160 }: PatchCableProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Scroll-voortgang van het element terwijl het door de viewport beweegt.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  });

  // Map de voortgang op een soepele pathLength. Een licht versoepelde
  // input-curve (extra ankerpunten) geeft een rustige, niet-lineaire optekening
  // zonder dat we de useTransform-easing-optie nodig hebben.
  const drawn = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6, 1],
    [0, 0.18, 0.62, 1],
  );

  // Bij reduced-motion volledig getekend; anders scroll-gekoppeld. In beide
  // gevallen een MotionValue zodat de typing klopt.
  const pathLength = useTransform(drawn, (v) => (prefersReducedMotion ? 1 : v));

  // Vaste viewBox; de kabel loopt verticaal door het midden.
  const VB_W = 64;
  const VB_H = 200;

  // Gebogen kabel: start onder de bovenste connector, twee tegengestelde
  // bochten (rustige S), eindigt boven de onderste connector.
  const cablePath = 'M32 34 C 14 70, 50 110, 32 166';

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none mx-auto flex w-16 justify-center"
      style={{ height }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Bovenste jack-connector */}
        <g stroke="var(--color-primary-deep)" strokeWidth={2}>
          <rect
            x={24}
            y={6}
            width={16}
            height={20}
            rx={3}
            fill="var(--color-surface-dark-1)"
          />
          <line x1={32} y1={26} x2={32} y2={34} stroke="var(--color-primary)" />
        </g>
        <circle cx={32} cy={11} r={2.5} fill="var(--color-tertiary)" />

        {/* Subtiele 'rust'-versie van de kabel als onderlaag */}
        <path
          d={cablePath}
          stroke="var(--color-primary)"
          strokeOpacity={0.14}
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* De zelftekenende kabel */}
        <motion.path
          d={cablePath}
          stroke="var(--color-primary)"
          strokeWidth={4}
          strokeLinecap="round"
          style={{ pathLength }}
        />

        {/* Onderste jack-connector */}
        <g stroke="var(--color-primary-deep)" strokeWidth={2}>
          <line x1={32} y1={166} x2={32} y2={174} stroke="var(--color-primary)" />
          <rect
            x={24}
            y={174}
            width={16}
            height={20}
            rx={3}
            fill="var(--color-surface-dark-1)"
          />
        </g>
        <circle cx={32} cy={189} r={2.5} fill="var(--color-tertiary)" />
      </svg>
    </div>
  );
}
