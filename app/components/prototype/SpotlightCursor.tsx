'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';

type SpotlightTone = 'warm' | 'teal';

interface SpotlightCursorProps {
  /** Kleur van de followspot. 'warm' = zand-gloed (default), 'teal' = petrol. */
  tone?: SpotlightTone;
  /** Diameter van de gloed in px. */
  size?: number;
}

const TONE_COLOR: Record<SpotlightTone, string> = {
  // Warm zand-licht voor 'licht'/gloed-warmte op backstage-donker.
  warm: 'var(--color-tertiary)',
  teal: 'var(--color-primary)',
};

/**
 * Fixed, pointer-events-none followspot die de muis met een zachte lag volgt.
 * Bewust géén useSpring (kan overshooten); een gedempte lerp via rAF houdt de
 * beweging rustig en doelgericht. Verborgen op touch-devices en bij
 * prefers-reduced-motion.
 */
export function SpotlightCursor({ tone = 'warm', size = 420 }: SpotlightCursorProps) {
  const prefersReducedMotion = useReducedMotion();

  // Motion values die we via rAF interpoleren naar de muispositie.
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const enabledRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Verberg op touch-devices (geen fijne pointer beschikbaar).
    const finePointer = window.matchMedia('(pointer: fine)');
    if (!finePointer.matches) return;

    enabledRef.current = true;

    // Doelpositie die de muis direct volgt; de motion values lerpen ernaartoe.
    const target = { x: x.get(), y: y.get() };
    let initialized = false;
    let frame = 0;

    const handleMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!initialized) {
        // Eerste hit: spring direct naar de cursor, geen veeg vanaf -9999.
        initialized = true;
        x.set(event.clientX);
        y.set(event.clientY);
      }
    };

    // Gedempte lerp: ~0.14 per frame voelt rustig zonder overshoot.
    const SMOOTHING = 0.14;
    const tick = () => {
      const nx = x.get() + (target.x - x.get()) * SMOOTHING;
      const ny = y.get() + (target.y - y.get()) * SMOOTHING;
      x.set(nx);
      y.set(ny);
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(frame);
      enabledRef.current = false;
    };
  }, [prefersReducedMotion, x, y]);

  if (prefersReducedMotion) return null;

  const color = TONE_COLOR[tone];

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] hidden [@media(pointer:fine)]:block"
      style={{
        x,
        y,
        width: size,
        height: size,
        // Centreer de gloed op de cursorpositie.
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        mixBlendMode: 'screen',
        background: `radial-gradient(circle at center, color-mix(in oklch, ${color} 38%, transparent) 0%, color-mix(in oklch, ${color} 14%, transparent) 42%, transparent 70%)`,
        willChange: 'transform',
      }}
    />
  );
}
