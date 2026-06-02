'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';

/**
 * Gedeelde easing van de huisstijl — geen bounce/elastic/overshoot.
 */
const EASE: Transition['ease'] = [0.16, 1, 0.3, 1];

/** De woorden die doorwisselen op het accent-slot. */
const WORDS = ['LICHT', 'GELUID', 'PODIUM', 'CREW'] as const;

/** Wisselinterval in ms. */
const INTERVAL = 2200;

/**
 * KineticHeadline — grote Anton-kop met één doorwisselend woord.
 *
 * 'WIJ VERZORGEN HET [LICHT].' waarbij het accent-woord roteert door
 * licht → geluid → podium → crew via een verticale mask-slide (geëased, géén
 * bounce). De slot-breedte is vast (gebaseerd op het langste woord) zodat de
 * layout niet springt tijdens de swap.
 *
 * Bij prefers-reduced-motion staat de cyclus uit en tonen we één woord statisch.
 */
export function KineticHeadline() {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, INTERVAL);

    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  // Statische eindtoestand bij reduced motion: toon het eerste woord.
  const word = prefersReducedMotion ? WORDS[0] : WORDS[index];

  return (
    <h2
      className="flex flex-wrap items-baseline gap-x-[0.35em] gap-y-2 font-[family-name:var(--font-display)] uppercase leading-[0.95] tracking-[0.01em] text-[var(--color-surface-dark)]"
      style={{ fontSize: 'clamp(2.25rem, 1.2rem + 5vw, 5.5rem)' }}
    >
      <span>Wij verzorgen het</span>

      {/* Vaste-breedte slot zodat de regel niet springt. De breedte wordt
          bepaald door een onzichtbaar exemplaar van het langste woord. */}
      <span className="relative inline-grid overflow-hidden align-baseline">
        {/* Spacer: reserveert de breedte van het langste woord (+ punt). */}
        <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {longestWord()}.
        </span>

        {prefersReducedMotion ? (
          <span className="col-start-1 row-start-1 whitespace-nowrap text-[var(--color-primary)]">
            {word}
            <span className="text-[var(--color-tertiary)]">.</span>
          </span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={word}
              className="col-start-1 row-start-1 whitespace-nowrap text-[var(--color-primary)]"
              initial={{ y: '0.55em', opacity: 0 }}
              animate={{ y: '0em', opacity: 1 }}
              exit={{ y: '-0.55em', opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {word}
              <span className="text-[var(--color-tertiary)]">.</span>
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </h2>
  );
}

/** Bepaalt het langste woord voor de vaste slot-breedte. */
function longestWord(): string {
  return WORDS.reduce((a, b) => (b.length > a.length ? b : a));
}
