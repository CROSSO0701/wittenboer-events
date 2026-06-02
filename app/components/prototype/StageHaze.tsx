'use client';

import { motion, useReducedMotion } from 'motion/react';

interface StageHazeProps {
  /**
   * Intensiteit van de schachten/haze (0–1). Hoger = iets zichtbaarder.
   * Default bewust laag voor een atmosferisch, niet-druk effect.
   */
  intensity?: number;
}

const EASE_LINEAR: [number, number, number, number] = [0, 0, 1, 1];

/**
 * Absoluut gepositioneerde, pointer-events-none sfeerlaag voor een donkere
 * sectie. De parent moet `relative` + `overflow-hidden` zijn.
 *
 * Twee gelaagde gradient-lagen: vaste volumetrische lichtschachten van bovenaf
 * (warm zand-licht) plus een traag driftende haze. Heel subtiel. Bij
 * prefers-reduced-motion vervalt de drift naar een statische versie.
 */
export function StageHaze({ intensity = 0.5 }: StageHazeProps) {
  const prefersReducedMotion = useReducedMotion();

  // Schaal de alpha-waarden met de intensiteit, blijf in een subtiel bereik.
  const a = (base: number) => Math.round(base * Math.min(Math.max(intensity, 0), 1));

  // Vaste lichtschachten van bovenaf — twee schuine kegels warm zand-licht.
  const shafts = `
    linear-gradient(168deg,
      color-mix(in oklch, var(--color-tertiary) ${a(18)}%, transparent) 0%,
      transparent 34%),
    linear-gradient(196deg,
      color-mix(in oklch, var(--color-tertiary-deep) ${a(14)}%, transparent) 0%,
      transparent 40%),
    radial-gradient(120% 80% at 50% -10%,
      color-mix(in oklch, var(--color-tertiary) ${a(16)}%, transparent) 0%,
      transparent 60%)
  `;

  // Driftende haze — zachte wolk die langzaam horizontaal beweegt.
  const haze = `
    radial-gradient(60% 50% at 30% 18%,
      color-mix(in oklch, var(--color-tertiary-soft) ${a(10)}%, transparent) 0%,
      transparent 70%),
    radial-gradient(50% 45% at 72% 30%,
      color-mix(in oklch, var(--color-tertiary) ${a(8)}%, transparent) 0%,
      transparent 70%)
  `;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    >
      {/* Statische volumetrische schachten van bovenaf. */}
      <div className="absolute inset-0" style={{ background: shafts }} />

      {/* Langzaam driftende haze-laag. */}
      <motion.div
        className="absolute -inset-x-[20%] inset-y-0"
        style={{ background: haze, willChange: 'transform, opacity' }}
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: ['-6%', '6%', '-6%'],
                opacity: [0.85, 1, 0.85],
              }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 16,
                ease: EASE_LINEAR,
                repeat: Infinity,
              }
        }
      />
    </div>
  );
}
