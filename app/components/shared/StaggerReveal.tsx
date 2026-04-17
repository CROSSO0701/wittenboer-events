'use client'

import { motion, type Variants } from 'motion/react'
import { stagger, fadeUp, viewportOnce } from '../../lib/motion'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'ul' | 'ol'
  variants?: Variants
  delay?: number
}

export function StaggerReveal({
  children,
  className,
  as = 'div',
  variants = stagger,
  delay,
}: Props) {
  const MotionEl = motion[as]
  const v = delay
    ? {
        ...variants,
        animate: {
          ...(variants.animate as object),
          transition: { ...((variants.animate as { transition?: object }).transition ?? {}), delayChildren: delay },
        },
      }
    : variants
  return (
    <MotionEl
      className={className}
      variants={v}
      initial="initial"
      whileInView="animate"
      viewport={viewportOnce}
    >
      {children}
    </MotionEl>
  )
}

export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'p' | 'h1' | 'h2' | 'h3' | 'span'
}) {
  const MotionEl = motion[as]
  return (
    <MotionEl className={className} variants={fadeUp}>
      {children}
    </MotionEl>
  )
}
