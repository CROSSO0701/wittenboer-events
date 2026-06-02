'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

interface FlightcaseCardProps {
  /** Stencil-label bovenaan de case (Anton uppercase). */
  title: string;
  /** Subregel onder de titel (kleiner, mono). */
  subtitle: string;
  /** Optioneel beeld dat het paneel vult (pad in /public). */
  image?: string;
}

/** Soepele, niet-overshoot easing conform huisstijl. */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Eén van de vier metalen hoekbeschermers van de roadcase.
 * `corner` bepaalt de plaatsing; de driehoek wijst naar buiten.
 */
function CornerGuard({
  corner,
}: {
  corner: 'tl' | 'tr' | 'bl' | 'br';
}) {
  const pos: Record<string, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  };
  const radius: Record<string, string> = {
    tl: 'rounded-tl-[10px]',
    tr: 'rounded-tr-[10px]',
    bl: 'rounded-bl-[10px]',
    br: 'rounded-br-[10px]',
  };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${pos[corner]} h-11 w-11 ${radius[corner]}`}
      style={{
        // Geborsteld-metaal hoekkap met lichte rand en schaduw voor reliëf.
        background:
          'linear-gradient(135deg, #6B7B82 0%, #3B4D54 45%, #232E34 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 2px rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.45)',
      }}
    >
      {/* Twee klinknagels per hoek. */}
      <span
        className="absolute h-1.5 w-1.5 rounded-full"
        style={{
          top: corner.startsWith('t') ? '7px' : 'auto',
          bottom: corner.startsWith('b') ? '7px' : 'auto',
          left: corner.endsWith('l') ? '7px' : 'auto',
          right: corner.endsWith('r') ? '7px' : 'auto',
          background:
            'radial-gradient(circle at 35% 30%, #C9D2D6 0%, #6B7B82 55%, #2A3840 100%)',
        }}
      />
    </div>
  );
}

/**
 * Project-/pakketkaart in de look van een flightcase (roadcase): donker
 * geborsteld paneel, vier metalen hoekbeschermers, een gestencild label-vlak
 * en een butterfly-latch die subtiel 'klikt' bij hover. Lift -4px op hover,
 * geëased, geen bounce. Respecteert prefers-reduced-motion.
 */
export function FlightcaseCard({ title, subtitle, image }: FlightcaseCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      tabIndex={0}
      className="group relative aspect-[4/5] w-full select-none overflow-hidden rounded-[14px] outline-none"
      style={{
        // Donker geborsteld kunststof-paneel met diepte.
        background:
          'linear-gradient(160deg, var(--color-surface-dark-1) 0%, var(--color-surface-dark) 60%, #1E2A30 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.05) inset, 0 18px 40px -22px rgba(0,0,0,0.7)',
      }}
      variants={{
        rest: { y: 0 },
        hover: prefersReducedMotion ? { y: 0 } : { y: -4 },
      }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* Optioneel beeld, ingelaten in het paneel met donkere rand. */}
      {image ? (
        <div className="absolute inset-[14px] overflow-hidden rounded-[6px]">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
          {/* Donkere wash zodat het label leesbaar blijft. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(42,56,64,0.25) 0%, rgba(30,42,48,0.30) 40%, rgba(20,28,32,0.85) 100%)',
            }}
          />
        </div>
      ) : null}

      {/* Subtiele schroefbout-rand rondom het ingelaten vlak. */}
      <div
        aria-hidden
        className="absolute inset-[14px] rounded-[6px]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}
      />

      {/* Vier metalen hoekbeschermers. */}
      <CornerGuard corner="tl" />
      <CornerGuard corner="tr" />
      <CornerGuard corner="bl" />
      <CornerGuard corner="br" />

      {/* Gestencild label-vlak. */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-6 pt-10">
        <div className="min-w-0">
          <span
            className="block font-mono text-[11px] uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-tertiary)' }}
          >
            {subtitle}
          </span>
          <h3
            className="mt-1 truncate text-3xl uppercase leading-[0.95]"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-fg-on-dark)',
              // Lichte stencil-look: dunne textuur over het zand-accent.
              textShadow: '0 1px 0 rgba(0,0,0,0.45)',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Butterfly-latch: behuizing met klep die 'klikt' bij hover. */}
        <motion.div
          aria-hidden
          className="relative h-12 w-10 shrink-0 rounded-[5px]"
          style={{
            background:
              'linear-gradient(140deg, #586870 0%, #2F3D44 70%, #1F2A30 100%)',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.10), 0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {/* Vlinderklep die naar binnen vouwt bij hover (de 'klik'). */}
          <motion.span
            className="absolute left-1/2 top-1.5 h-6 w-6 origin-top -translate-x-1/2 rounded-[3px]"
            style={{
              background:
                'linear-gradient(160deg, #C9D2D6 0%, #8A979D 45%, #586870 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.45)',
            }}
            variants={{
              rest: { rotateX: 0, y: 0 },
              hover: prefersReducedMotion
                ? { rotateX: 0, y: 0 }
                : { rotateX: -42, y: 1 },
            }}
            transition={{ duration: 0.45, ease: EASE }}
          />
          {/* Onderhaak waar de klep in vergrendelt. */}
          <span
            className="absolute bottom-1.5 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-[2px]"
            style={{
              background: 'linear-gradient(180deg, #43545B 0%, #1F2A30 100%)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.6)',
            }}
          />
        </motion.div>
      </div>
    </motion.article>
  );
}
