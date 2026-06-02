'use client';

import { motion, useReducedMotion, type Variants, type Transition } from 'motion/react';

/**
 * Gedeelde easing van de huisstijl — rustig, doelgericht, geen overshoot.
 */
const EASE: Transition['ease'] = [0.16, 1, 0.3, 1];

/**
 * HeroPowerUp — donkere backstage-hero die bij mount 'aangaat' als toneellicht.
 *
 * Volgorde:
 *  1. Een warme lichtwash + brightness ramp-t van bijna-zwart omhoog (de "power up").
 *  2. Warme beams zakken van boven binnen.
 *  3. De Anton-kop en subregel faden omhoog met een dimmer-ramp (opacity + lichte y).
 *  4. De teal CTA verschijnt als laatste.
 *
 * Bij prefers-reduced-motion wordt direct de eindtoestand getoond (geen ramp).
 */
export function HeroPowerUp() {
  const prefersReducedMotion = useReducedMotion();

  // Eindtoestand-helper: bij reduced motion gebruiken we de "to"-waarden meteen.
  const lit = prefersReducedMotion;

  // De lichtwash: brightness/opacity ramp van donker naar warm verlicht.
  const washVariants: Variants = {
    dark: { opacity: 0, filter: 'brightness(0.25)' },
    lit: {
      opacity: 1,
      filter: 'brightness(1)',
      transition: { duration: 1.4, ease: EASE },
    },
  };

  // Beams zakken van boven binnen met een zachte fade.
  const beamVariants: Variants = {
    dark: { opacity: 0, scaleY: 0.6 },
    lit: (i: number) => ({
      opacity: 1,
      scaleY: 1,
      transition: { duration: 1.2, ease: EASE, delay: 0.25 + i * 0.12 },
    }),
  };

  // Tekst-stagger: dimmer-ramp omhoog (opacity + kleine y-verschuiving).
  const groupVariants: Variants = {
    dark: {},
    lit: {
      transition: { delayChildren: 0.7, staggerChildren: 0.14 },
    },
  };

  const itemVariants: Variants = {
    dark: { opacity: 0, y: 24 },
    lit: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: EASE },
    },
  };

  // Bij reduced motion alles meteen op 'lit' zetten zonder transition-delays.
  const initial = lit ? 'lit' : 'dark';
  const animate = 'lit';

  return (
    <section
      aria-label="Wittenboer Events — licht, geluid en podium"
      className="relative isolate flex min-h-[80vh] w-full items-center overflow-hidden bg-[var(--color-surface-dark)] text-[var(--color-fg-on-dark)]"
    >
      {/* Basis backstage-laag: van bijna-zwart naar het donkere surface. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, var(--color-surface-dark-1) 0%, var(--color-surface-dark) 45%, #1A242A 100%)',
        }}
      />

      {/* Warme lichtwash die 'aangaat' — power-up ramp van brightness + opacity. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 mix-blend-screen"
        variants={washVariants}
        initial={initial}
        animate={animate}
        style={{
          background:
            'radial-gradient(70% 60% at 50% 8%, color-mix(in oklch, var(--color-tertiary) 42%, transparent) 0%, color-mix(in oklch, var(--color-tertiary) 14%, transparent) 38%, transparent 70%)',
          willChange: 'opacity, filter',
        }}
      />

      {/* Warme beams van boven. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex h-full justify-center gap-[10vw]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={beamVariants}
            initial={initial}
            animate={animate}
            className="h-full w-[16vw] origin-top mix-blend-screen"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in oklch, var(--color-tertiary) 30%, transparent) 0%, transparent 70%)',
              clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)',
              willChange: 'opacity, transform',
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative mx-auto flex w-full max-w-[80rem] flex-col items-start gap-6 px-6 py-24 sm:px-10"
        variants={groupVariants}
        initial={initial}
        animate={animate}
      >
        <motion.p
          variants={itemVariants}
          className="font-[family-name:var(--font-mono)] text-[0.8rem] uppercase tracking-[0.3em] text-[var(--color-tertiary)]"
        >
          Wittenboer Events
        </motion.p>

        <motion.h1
          variants={itemVariants}
          className="font-[family-name:var(--font-display)] uppercase leading-[0.92] tracking-[0.01em] text-[var(--color-fg-on-dark)]"
          style={{ fontSize: 'clamp(2.75rem, 1.4rem + 6vw, 7rem)' }}
        >
          Licht. Geluid.
          <br />
          Podium.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="max-w-[42ch] text-balance text-lg leading-relaxed text-[var(--color-fg-on-dark-muted)] sm:text-xl"
        >
          Van eerste schets tot laatste noot — wij regelen alles. U denkt aan de
          beleving, wij aan de techniek en de crew.
        </motion.p>

        <motion.div variants={itemVariants}>
          <a
            href="#offerte"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-fg-on-dark)] transition-[background-color,transform] duration-300 hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tertiary)]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
          >
            Vraag een voorstel aan
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
