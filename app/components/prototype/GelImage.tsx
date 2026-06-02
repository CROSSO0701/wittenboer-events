'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

interface GelImageProps {
  /** Beeldpad in /public. */
  src: string;
  /** Toegankelijke alt-tekst. */
  alt: string;
  /** Kleur van de 'gel' die voor de lamp komt. Default: warm. */
  gel?: 'warm' | 'teal';
}

/** Soepele, niet-overshoot easing conform huisstijl. */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Beeld dat standaard bijna grijs is (grayscale + lage saturatie) en een warme
 * of teal 'kleurgel'-wash krijgt zodra het in beeld scrollt of bij hover —
 * alsof er een gel voor een lamp wordt geschoven. Alle filter- en
 * overlay-transities zijn geëased. Respecteert prefers-reduced-motion: dan is
 * de gel direct actief en vervalt de instap-animatie.
 */
export function GelImage({ src, alt, gel = 'warm' }: GelImageProps) {
  const prefersReducedMotion = useReducedMotion();

  // Kleur-wash per gel-type, in OKLCH via de huisstijl-tokens.
  const wash =
    gel === 'teal'
      ? 'linear-gradient(150deg, color-mix(in oklch, var(--color-primary) 55%, transparent) 0%, color-mix(in oklch, var(--color-primary-deep) 35%, transparent) 100%)'
      : 'linear-gradient(150deg, color-mix(in oklch, var(--color-tertiary) 50%, transparent) 0%, color-mix(in oklch, var(--color-tertiary-deep) 60%, transparent) 100%)';

  // 'lit' = gel ervoor (warm/teal, vol kleur); 'dim' = bijna grijs.
  const dimFilter = 'grayscale(0.85) saturate(0.35) brightness(0.92)';
  const litFilter = 'grayscale(0) saturate(1.05) brightness(1)';

  return (
    <motion.figure
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-[12px]"
      initial="dim"
      animate={prefersReducedMotion ? 'lit' : undefined}
      whileInView={prefersReducedMotion ? undefined : 'lit'}
      whileHover="lit"
      viewport={{ once: false, amount: 0.4 }}
    >
      {/* Het beeld zelf: filter schakelt tussen grijs en vol kleur. */}
      <motion.div
        className="absolute inset-0"
        style={{ willChange: 'filter' }}
        variants={{
          dim: { filter: dimFilter },
          lit: { filter: litFilter },
        }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />
      </motion.div>

      {/* Kleurgel-wash bovenop, met screen-blend zodat het als licht oogt. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: wash, mixBlendMode: 'screen', willChange: 'opacity' }}
        variants={{
          dim: { opacity: 0 },
          lit: { opacity: 1 },
        }}
        transition={{ duration: 0.9, ease: EASE }}
      />

      {/* Subtiele vignet zodat de gel naar het midden 'gloeit'. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(20,28,32,0.35) 100%)',
        }}
      />
    </motion.figure>
  );
}
