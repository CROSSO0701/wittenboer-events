'use client'

import { useRef, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

type Variant = 'solid' | 'ghost'

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: Variant
  className?: string
  ariaLabel?: string
}

const RADIUS = 80
const STRENGTH = 0.35

export function MagneticButton({
  children,
  href,
  onClick,
  variant = 'solid',
  className = '',
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 22, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 200, damping: 22, mass: 0.6 })
  const tx = useTransform(sx, (v) => v * STRENGTH)
  const ty = useTransform(sy, (v) => v * STRENGTH)

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > RADIUS) {
      x.set(0)
      y.set(0)
      return
    }
    x.set(dx)
    y.set(dy)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  const base =
    'relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] text-[15px] font-medium tracking-tight transition-colors duration-200 will-change-transform'
  const solid =
    'text-[var(--color-fg-on-dark)] [background-color:var(--color-primary)] hover:[background-color:var(--color-primary-hover)]'
  const ghost =
    'text-[var(--color-fg)] border border-[color:var(--color-border-strong)] hover:[background-color:var(--color-surface-1)]'

  const cls = `${base} ${variant === 'solid' ? solid : ghost} ${className}`

  const Inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: tx, y: ty }}
      className="inline-block"
    >
      <span className={cls}>
        {children}
      </span>
    </motion.div>
  )

  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className="inline-block focus-visible:outline-none">
        {Inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="inline-block focus-visible:outline-none">
      {Inner}
    </button>
  )
}
