'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Power-up-laag over de bestaande hero-foto: bij het laden start de backdrop
 * donker (alsof de zaal nog uit is) en gaan de lichten aan — een warme wash +
 * een paar lichtbeams van boven warmen de foto op. Ligt op z-index 1 (boven de
 * foto/overlays, ónder de tekst op z-index 2), dus het contrast van de
 * hero-tekst blijft ongemoeid. Respecteert prefers-reduced-motion.
 */
export function HeroLights() {
  const reduce = useReducedMotion()
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLit(true), 90)
    return () => clearTimeout(t)
  }, [])

  if (reduce) return null

  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {/* Blackout die optrekt: de foto "gaat aan". */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: lit ? 0 : 1 }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{ position: 'absolute', inset: 0, background: 'var(--color-surface-dark)' }}
      />

      {/* Warme lichtbeams van bovenaf — schuin, mengen op de foto. */}
      {[18, 42, 70].map((left, i) => (
        <motion.div
          key={left}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: lit ? 0.4 : 0, y: lit ? 0 : -30 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.25 + i * 0.12 }}
          style={{
            position: 'absolute',
            top: '-12%',
            left: `${left}%`,
            width: '22%',
            height: '120%',
            transform: `rotate(${i % 2 === 0 ? 8 : -8}deg)`,
            transformOrigin: 'top center',
            background:
              'linear-gradient(180deg, color-mix(in oklab, var(--color-tertiary) 70%, transparent) 0%, transparent 72%)',
            filter: 'blur(22px)',
            mixBlendMode: 'screen',
          }}
        />
      ))}

      {/* Subtiele warme wash bovenin (niet over de tekst onderin). */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: lit ? 0.22 : 0 }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 70% at 50% -10%, color-mix(in oklab, var(--color-tertiary) 55%, transparent) 0%, transparent 60%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}
