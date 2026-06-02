'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Kinetisch wisselwoord voor de hero-kop: het woord rolt elke ~2,2s omhoog naar
 * het volgende (slot-stijl, geëased, geen bounce, mode=wait zodat woorden nooit
 * overlappen). Erft de kop-styling (Anton + accentkleur). Alle woorden worden
 * onzichtbaar gestapeld in één grid-cel zodat de breedte op het BREEDSTE woord
 * staat (geen afkapping, geen layout-shift). Iets ruimere regelhoogte zodat
 * staartletters (p/g) niet door de mask worden geknipt. Respecteert
 * prefers-reduced-motion (toont dan één woord).
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

  if (reduce) return <>{words[0]}.</>

  return (
    <span style={{ display: 'inline-grid', verticalAlign: 'bottom', lineHeight: 1.15 }}>
      {/* Onzichtbare sizers: bepalen samen de breedte (= breedste woord). */}
      {words.map((w) => (
        <span key={w} aria-hidden style={{ gridArea: '1 / 1', visibility: 'hidden', whiteSpace: 'nowrap' }}>
          {w}.
        </span>
      ))}
      <span style={{ gridArea: '1 / 1', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={words[i]}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-110%', opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            style={{ display: 'inline-block', whiteSpace: 'nowrap', willChange: 'transform' }}
          >
            {words[i]}.
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}
