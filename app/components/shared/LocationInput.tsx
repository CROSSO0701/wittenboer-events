'use client'

import { useEffect, useId, useRef, useState } from 'react'

type Suggestion = { label: string }

/**
 * Adres-input met autocomplete via /api/geo/search (server-proxy naar Photon).
 *
 * Werkt in een gewoon FormData-formulier: render een echte <input name=…> zodat
 * de waarde meekomt bij submit. Vrij typen blijft altijd toegestaan — een
 * suggestie kiezen is optioneel. De suggesties-dropdown is met inline
 * OKLCH-tokens gestyled zodat hij er in zowel de admin-dialog als het publieke
 * formulier identiek uitziet.
 */
export function LocationInput({
  name,
  defaultValue = '',
  placeholder,
  required,
  className,
  id,
}: {
  name?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  /** Optionele input-classes (admin gebruikt de shadcn Input-stijl; publiek laat CSS het doen). */
  className?: string
  id?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)

  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  // Markeert dat de laatste wijziging een keuze was, zodat we niet meteen
  // opnieuw gaan zoeken op de zojuist ingevulde adresregel.
  const justPickedRef = useRef(false)

  // Debounced fetch (300ms) zodra de gebruiker typt.
  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false
      return
    }
    const q = value.trim()
    if (q.length < 3) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    let cancelled = false
    const controller = new AbortController()
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        const data = (await res.json().catch(() => ({}))) as { results?: Suggestion[] }
        if (cancelled) return
        const items = data.results ?? []
        setSuggestions(items)
        setActive(-1)
        setOpen(items.length > 0)
      } catch {
        if (!cancelled) {
          setSuggestions([])
          setOpen(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(handle)
    }
  }, [value])

  // Sluiten bij klik buiten de component.
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function pick(label: string) {
    justPickedRef.current = true
    setValue(label)
    setOpen(false)
    setActive(-1)
    setSuggestions([])
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      // Pijl-omlaag heropent een eerder opgehaalde lijst.
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault()
        setOpen(true)
        setActive(0)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      // Alleen onderscheppen als er een suggestie geselecteerd is; anders gewoon
      // het formulier laten submitten met de vrij-getypte waarde.
      if (active >= 0 && active < suggestions.length) {
        e.preventDefault()
        pick(suggestions[active]!.label)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        id={id}
        type="text"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listboxId}-opt-${active}` : undefined}
        className={className}
        // Vul altijd de wrapper-breedte. In de admin doet w-full dit ook, maar in
        // het publieke .contact-form is de input nu een geneste node (geen directe
        // flex-child meer) en zou hij anders zijn intrinsieke breedte aannemen.
        style={{ width: '100%', boxSizing: 'border-box' }}
        suppressHydrationWarning
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(30, 42, 47, 0.12)',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${i}`}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                // mouseDown i.p.v. click: voorkomt blur vóór de keuze.
                e.preventDefault()
                pick(s.label)
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: '8px 10px',
                fontSize: 14,
                lineHeight: 1.35,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--color-fg)',
                background: i === active ? 'var(--color-primary-soft)' : 'transparent',
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {loading && value.trim().length >= 3 && suggestions.length === 0 && (
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12,
            color: 'var(--color-fg-muted)',
            pointerEvents: 'none',
          }}
        >
          Zoeken…
        </span>
      )}
    </div>
  )
}

export default LocationInput
