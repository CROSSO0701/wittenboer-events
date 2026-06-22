'use client'

import { useEffect } from 'react'

// Registreert de service worker zodat de portal installeerbaar wordt
// (app-icoon op het beginscherm). Rendert zelf niets.
export function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Stil falen: zonder service worker werkt de portal gewoon door,
        // alleen de installeren-prompt verschijnt dan niet.
      })
    }
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
