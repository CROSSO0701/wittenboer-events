'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Kinetisch wisselwoord voor de hero-kop: het woord rolt elke ~2,2s omhoog naar
 * het volgende (slot-stijl, geëased, geen bounce). Erft de kop-styling (Anton +
 * accentkleur). Breedte gereserveerd op het langste woord zodat de layout niet
 * springt. Respecteert prefers-reduced-motion (toont dan één woord).
 */
export function HeroKinetic({
  words = ['licht', 'geluid', 'podium', 'crew'],
  interval = 2200,
}: {
  words?: string[]
  interval?: number
}) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce || words.length < 2) return
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval)
    return () => clearInterval(t)
  }, [reduce, words.length, interval])

  const sizer = words.reduce((a, b) => (b.length > a.length ? b : a), '')
  if (reduce) return <>{words[0]}.</>

  return (
    <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <span aria-hidden style={{ visibility: 'hidden' }}>
        {sizer}.
      </span>
      <span style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={words[i]}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-110%', opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            style={{ display: 'inline-block', willChange: 'transform' }}
          >
            {words[i]}.
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}
