'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'motion/react'

type SpotlightTone = 'warm' | 'teal'

interface SpotlightCursorProps {
  /** Kleur van de followspot. 'warm' = zand-gloed (default), 'teal' = petrol. */
  tone?: SpotlightTone
  /** Diameter van de gloed in px. */
  size?: number
}

const TONE_COLOR: Record<SpotlightTone, string> = {
  warm: 'var(--color-tertiary)',
  teal: 'var(--color-primary)',
}

/**
 * Fixed, pointer-events-none followspot die de muis met een zachte lag volgt.
 * Bewust ZACHT (lage opacity) en op een z-index ónder de nav, zodat het op de
 * donkere secties subtiel diepte geeft zonder de donkere tekst op lichte
 * pagina's te verbleken. Géén useSpring (kan overshooten); een gedempte lerp
 * via rAF houdt 'm rustig. Verborgen op touch + reduced-motion.
 */
export function SpotlightCursor({ tone = 'warm', size = 460 }: SpotlightCursorProps) {
  const prefersReducedMotion = useReducedMotion()
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const enabledRef = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion) return
    const finePointer = window.matchMedia('(pointer: fine)')
    if (!finePointer.matches) return

    enabledRef.current = true
    const target = { x: x.get(), y: y.get() }
    let initialized = false
    let frame = 0

    const handleMove = (event: PointerEvent) => {
      target.x = event.clientX
      target.y = event.clientY
      if (!initialized) {
        initialized = true
        x.set(event.clientX)
        y.set(event.clientY)
      }
    }

    const SMOOTHING = 0.14
    const tick = () => {
      x.set(x.get() + (target.x - x.get()) * SMOOTHING)
      y.set(y.get() + (target.y - y.get()) * SMOOTHING)
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      cancelAnimationFrame(frame)
      enabledRef.current = false
    }
  }, [prefersReducedMotion, x, y])

  if (prefersReducedMotion) return null

  const color = TONE_COLOR[tone]
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[30] hidden [@media(pointer:fine)]:block"
      style={{
        x,
        y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        mixBlendMode: 'screen',
        background: `radial-gradient(circle at center, color-mix(in oklch, ${color} 16%, transparent) 0%, color-mix(in oklch, ${color} 6%, transparent) 46%, transparent 72%)`,
        willChange: 'transform',
      }}
    />
  )
}
