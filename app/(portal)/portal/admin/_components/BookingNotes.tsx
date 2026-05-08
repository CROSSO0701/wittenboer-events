'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Send } from 'lucide-react'
import { Textarea } from '../../../../components/ui/textarea'
import { Button } from '../../../../components/ui/button'

type Author = { full_name: string | null; role: string | null } | null

type Note = {
  id: string
  body: string
  created_at: string
  author_id: string | null
  author: Author
}

function fmtAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'zojuist'
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`
  if (diff < 86400) return `${Math.floor(diff / 3600)} u geleden`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d geleden`
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  )
}

export function BookingNotes({ bookingId }: { bookingId: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/notes`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Status ${res.status}`)
      setNotes((data.notes as Note[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [bookingId])

  useEffect(() => {
    load()
  }, [load])

  async function add() {
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Status ${res.status}`)
        return
      }
      setBody('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-2 border-t border-[var(--color-border)] pt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-muted)]">
        <MessageSquare size={12} /> Notities
        {notes && notes.length > 0 && (
          <span className="rounded-full bg-[var(--color-surface-1)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
            {notes.length}
          </span>
        )}
      </h3>

      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {notes && notes.length === 0 && (
        <p className="mb-3 text-xs text-[var(--color-fg-muted)]">
          Nog geen notities. Vul hieronder iets in om de eerste toe te voegen.
        </p>
      )}

      {notes && notes.length > 0 && (
        <ol className="mb-3 flex flex-col gap-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2 text-sm"
            >
              <div className="mb-1 flex items-baseline justify-between gap-3 text-[11px] text-[var(--color-fg-muted)]">
                <span className="font-medium text-[var(--color-fg)]">
                  {n.author?.full_name ?? 'onbekend'}
                  {n.author?.role && (
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                      · {n.author.role}
                    </span>
                  )}
                </span>
                <time>{fmtAgo(n.created_at)}</time>
              </div>
              <p className="whitespace-pre-wrap text-[var(--color-fg)]">{n.body}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Voeg een notitie toe (zichtbaar voor admin en betrokken artiest)..."
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') add()
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--color-fg-muted)]">
            ⌘/Ctrl + Enter om te plaatsen
          </span>
          <Button onClick={add} disabled={submitting || !body.trim()} size="sm">
            <Send size={14} /> {submitting ? 'Plaatsen…' : 'Plaatsen'}
          </Button>
        </div>
      </div>
    </section>
  )
}
