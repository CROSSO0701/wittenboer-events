'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

export type KlusType = { id: string; label: string; sort_order: number; active: boolean }

export function KlusTypesManager({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  // Aangeroepen na elke succesvolle wijziging, zodat de aanroeper de dropdown kan verversen.
  onChanged?: () => void
}) {
  const [types, setTypes] = useState<KlusType[] | null>(null)
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/klus-types?all=1', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        setTypes([])
        return
      }
      setTypes((data.types as KlusType[]) ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Laden faalde')
      setTypes([])
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setLabel('')
      return
    }
    setTypes(null)
    load()
  }, [open, load])

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = label.trim()
    if (!value) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/klus-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Type toegevoegd.')
      setLabel('')
      await load()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Toevoegen faalde')
    } finally {
      setAdding(false)
    }
  }

  async function onRemove(t: KlusType) {
    // Geen native confirm (die bevriest + is lelijk); types zijn laag-risico en
    // makkelijk opnieuw toe te voegen. De rode trash-knop is de affordance.
    setDeletingId(t.id)
    try {
      const res = await fetch(`/api/admin/klus-types/${t.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      toast.success('Type verwijderd.')
      await load()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen faalde')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Klus-types beheren</DialogTitle>
          <DialogDescription>
            Voeg eigen types toe of haal ze weg. Bestaande klussen behouden hun type, ook na
            verwijderen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {types === null ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)]"
                />
              ))}
            </div>
          ) : types.length === 0 ? (
            <p className="text-sm text-[var(--color-fg-muted)]">Nog geen types. Voeg er hieronder een toe.</p>
          ) : (
            <ul className="space-y-2">
              {types.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-[var(--color-fg)]">
                    {t.label}
                    {!t.active && (
                      <span className="ml-2 text-xs font-normal text-[var(--color-fg-muted)]">(inactief)</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(t)}
                    disabled={deletingId === t.id}
                    aria-label={`Type ${t.label} verwijderen`}
                    className="shrink-0 rounded-md p-1.5 text-[var(--color-fg-muted)] transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={onAdd} className="flex items-center gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nieuw type, bijv. Transport"
            maxLength={60}
            aria-label="Nieuw type"
          />
          <Button type="submit" disabled={adding || !label.trim()} className="shrink-0">
            <Plus size={15} /> {adding ? 'Toevoegen…' : 'Toevoegen'}
          </Button>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
