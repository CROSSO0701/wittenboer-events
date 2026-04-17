import type { Variants, Transition } from 'motion/react'

const ease: [number, number, number, number] = [0.25, 1, 0.5, 1]

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.7, ease } },
}

export const stagger: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
}

export const staggerSlow: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
}

export const spring: Transition = { type: 'spring', stiffness: 120, damping: 18 }

export const viewportOnce = { once: true, amount: 0.25 } as const
