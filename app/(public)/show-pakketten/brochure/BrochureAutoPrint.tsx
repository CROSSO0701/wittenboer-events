'use client'

import { useEffect } from 'react'

export function BrochureAutoPrint() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.print()
    }, 800)
    return () => window.clearTimeout(t)
  }, [])
  return null
}
