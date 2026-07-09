'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

/**
 * Gedeelde crew-lijst hook (#120).
 *
 * De query "profiles waar role='staff'" werd los herhaald in AcceptDialog,
 * AssignStaffDialog, CrewAvailabilityDialog en StaffPanel. Deze hook haalt die
 * lijst één keer op en cachet hem in-memory, zodat dezelfde data niet bij elke
 * dialog opnieuw over de lijn gaat.
 *
 * Veilig/additief: faalt de fetch (RLS/cookies/leeg) dan valt de lijst terug op
 * een lege array — exact het bestaande gedrag van alle vier de call-sites
 * (`catch -> setStaff([])`). De volledige kolom-set (incl. phone) wordt
 * opgehaald als superset; consumers die phone niet nodig hebben negeren het.
 */
export type StaffListItem = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  has_password: boolean
}

// Eén ophaal-query selecteert alle kolommen die enige consumer nodig heeft. Het
// agenda-feed-token wordt bewust NIET meer meegehaald: de admin haalt de
// agenda-link per crewlid op via de server-route /api/admin/staff/[id]/calendar-link
// (service-role), zodat het bearer-token niet in de browser belandt.
const SELECT = 'id, full_name, email, phone, has_password'

type CacheEntry = {
  data: StaffListItem[] | null
  inflight: Promise<StaffListItem[]> | null
}

// Cache per order-variant, zodat de geordende call-sites (full_name asc) en de
// ongeordende call-sites elk hun eigen — identieke — volgorde houden.
const caches: Record<'ordered' | 'unordered', CacheEntry> = {
  ordered: { data: null, inflight: null },
  unordered: { data: null, inflight: null },
}

// Abonnees per variant; bij refresh worden ze allemaal bijgewerkt.
const subscribers: Record<'ordered' | 'unordered', Set<(rows: StaffListItem[]) => void>> = {
  ordered: new Set(),
  unordered: new Set(),
}

async function fetchStaff(ordered: boolean): Promise<StaffListItem[]> {
  try {
    const supabase = createSupabaseBrowserClient()
    let query = supabase.from('profiles').select(SELECT).eq('role', 'staff').is('archived_at', null)
    if (ordered) query = query.order('full_name', { ascending: true })
    const { data } = await query
    return (data as StaffListItem[] | null) ?? []
  } catch {
    // RLS/cookies/env kunnen dit blokkeren — val terug op leeg (bestaand gedrag).
    return []
  }
}

async function loadInto(key: 'ordered' | 'unordered'): Promise<StaffListItem[]> {
  const cache = caches[key]
  if (cache.inflight) return cache.inflight
  const promise = fetchStaff(key === 'ordered').then((rows) => {
    cache.data = rows
    cache.inflight = null
    for (const cb of subscribers[key]) cb(rows)
    return rows
  })
  cache.inflight = promise
  return promise
}

export function useStaffList(
  options: { enabled?: boolean; ordered?: boolean } = {}
): { staff: StaffListItem[]; refresh: () => Promise<void> } {
  const { enabled = true, ordered = true } = options
  const key: 'ordered' | 'unordered' = ordered ? 'ordered' : 'unordered'

  const [staff, setStaff] = useState<StaffListItem[]>(() => caches[key].data ?? [])

  useEffect(() => {
    if (!enabled) return
    const cb = (rows: StaffListItem[]) => setStaff(rows)
    subscribers[key].add(cb)

    const cached = caches[key].data
    if (cached) {
      // Gebruik direct de cache; geen extra round-trip.
      setStaff(cached)
    } else {
      void loadInto(key)
    }

    return () => {
      subscribers[key].delete(cb)
    }
  }, [enabled, key])

  const refresh = useCallback(async () => {
    // Forceer een verse fetch (bv. na mutatie in StaffPanel) en update alle abonnees.
    caches[key].data = null
    caches[key].inflight = null
    await loadInto(key)
  }, [key])

  return { staff, refresh }
}
