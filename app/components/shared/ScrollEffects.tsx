'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollEffects() {
  const pathname = usePathname()

  // Persistent: nav shrink + scroll progress + parallax
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('js-loaded')

    let rafQueued = false
    let lastY = 0

    const navEl = document.querySelector('.nav')
    const progressBar = document.querySelector<HTMLElement>('.scroll-progress__bar')

    const update = () => {
      rafQueued = false
      const y = lastY
      if (navEl) navEl.classList.toggle('is-scrolled', y > 16)
      if (progressBar) {
        const max = html.scrollHeight - window.innerHeight
        const pct = max > 0 ? y / max : 0
        progressBar.style.transform = `scaleX(${pct})`
      }
      const vh = window.innerHeight
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > vh) return
        const speed = parseFloat(el.dataset.parallaxSpeed || '0.15')
        const center = rect.top + rect.height / 2 - vh / 2
        el.style.setProperty('--pl', `${-center * speed}px`)
      })
    }

    const onScroll = () => {
      lastY = window.scrollY
      if (!rafQueued) {
        rafQueued = true
        requestAnimationFrame(update)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Re-observe on every route change
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      // Skip animation overhead entirely
      document
        .querySelectorAll('[data-reveal], [data-reveal-stagger], [data-img-zoom], .split-line')
        .forEach((el) => el.classList.add('is-in'))
      return
    }

    let cancelled = false
    let revealIo: IntersectionObserver | null = null
    let splitIo: IntersectionObserver | null = null
    let safety: number | null = null

    const init = () => {
      if (cancelled) return
      const vh = window.innerHeight
      const inViewport = (el: Element) => {
        const r = el.getBoundingClientRect()
        return r.top < vh && r.bottom > 0
      }

      revealIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in')
              revealIo?.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
      )
      document
        .querySelectorAll('[data-reveal], [data-reveal-stagger], [data-img-zoom]')
        .forEach((el) => {
          if (inViewport(el)) {
            // Already visible at mount → flip immediately, skip observer race
            el.classList.add('is-in')
          } else {
            revealIo!.observe(el)
          }
        })

      splitIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in')
              splitIo?.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -5% 0px', threshold: 0.05 }
      )
      document.querySelectorAll('.split-line').forEach((el) => {
        if (inViewport(el)) {
          el.classList.add('is-in')
        } else {
          splitIo!.observe(el)
        }
      })

      // Last-resort safety after 400ms — covers anything that slipped past
      safety = window.setTimeout(() => {
        if (cancelled) return
        const vhNow = window.innerHeight
        document
          .querySelectorAll('[data-reveal], [data-reveal-stagger], [data-img-zoom], .split-line')
          .forEach((el) => {
            if (el.classList.contains('is-in')) return
            const r = el.getBoundingClientRect()
            if (r.top < vhNow && r.bottom > 0) el.classList.add('is-in')
          })
      }, 400)
    }

    const raf = requestAnimationFrame(init)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (safety) window.clearTimeout(safety)
      revealIo?.disconnect()
      splitIo?.disconnect()
    }
  }, [pathname])

  return null
}
