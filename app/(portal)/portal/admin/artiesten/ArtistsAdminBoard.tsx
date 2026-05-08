'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { UserPlus, Send, ShieldOff } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Badge } from '../../../../components/ui/badge'

type ArtistRow = {
  id: string
  stage_name: string
  slug: string
  genre: string | null
  photo_url: string | null
  active: boolean
  profile_id: string | null
  display_order: number
}

export function ArtistsAdminBoard({ artists }: { artists: ArtistRow[] }) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ArtistRow | null>(null)

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Artiest toevoegen
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Podiumnaam</th>
              <th className="px-4 py-2">Genre</th>
              <th className="px-4 py-2">Toegang</th>
              <th className="px-4 py-2 text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-1)] text-sm font-semibold text-[var(--color-fg-muted)]">
                    {a.photo_url ? (
                      <Image src={a.photo_url} alt={a.stage_name} width={36} height={36} style={{ objectFit: 'cover' }} />
                    ) : (
                      <span>{a.stage_name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-fg)]">{a.stage_name}</td>
                <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{a.genre ?? '—'}</td>
                <td className="px-4 py-3">
                  {a.profile_id ? (
                    <Badge tone="accepted">Toegang actief</Badge>
                  ) : (
                    <Badge tone="neutral">Geen toegang</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {a.profile_id ? (
                    <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(a)}>
                      <ShieldOff size={14} /> Toegang intrekken
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInviteOpen(true)
                      }}
                    >
                      <Send size={14} /> Toegang geven
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        unlinkedArtists={artists.filter((a) => !a.profile_id)}
        onSuccess={() => {
          setInviteOpen(false)
          router.refresh()
        }}
      />

      {revokeTarget && (
        <RevokeDialog
          artist={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onSuccess={() => {
            setRevokeTarget(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function InviteDialog({
  open,
  onOpenChange,
  unlinkedArtists,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  unlinkedArtists: ArtistRow[]
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [artistId, setArtistId] = useState('')
  const [stageName, setStageName] = useState('')
  const [genre, setGenre] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const body =
        mode === 'existing' ? { artist_id: artistId, email } : { stage_name: stageName, genre, photo_url: photoUrl, email }
      const res = await fetch('/api/admin/artists/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Fout bij uitnodigen (${res.status})`)
        return
      }
      if (data.mailSent) toast.success('Uitnodiging verstuurd. De artiest krijgt direct een mail.')
      else toast.warning(`Account aangemaakt. Mail kon niet worden verstuurd: ${data.mailError ?? 'onbekend'}`)
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artiest toevoegen</DialogTitle>
          <DialogDescription>
            De artiest krijgt direct een mail om in te loggen en een wachtwoord te kiezen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`rounded-full border px-3 py-1 ${
              mode === 'existing'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)]'
            }`}
          >
            Bestaande artiest
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`rounded-full border px-3 py-1 ${
              mode === 'new'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]'
                : 'border-[var(--color-border)] text-[var(--color-fg-muted)]'
            }`}
          >
            Nieuwe artiest
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="flex flex-col gap-1.5">
            <Label>Welke artiest?</Label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className="h-10 rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm"
            >
              <option value="">Kies een artiest…</option>
              {unlinkedArtists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stage_name}
                </option>
              ))}
            </select>
            {unlinkedArtists.length === 0 && (
              <p className="text-xs text-[var(--color-fg-muted)]">
                Alle bestaande artiesten hebben al toegang. Kies &ldquo;Nieuwe artiest&rdquo;.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Podiumnaam *" value={stageName} onChange={setStageName} />
            <Field label="Genre" value={genre} onChange={setGenre} />
            <Field label="Foto-URL" value={photoUrl} onChange={setPhotoUrl} className="sm:col-span-2" />
          </div>
        )}

        <Field label="E-mailadres *" type="email" value={email} onChange={setEmail} />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !email || (mode === 'existing' && !artistId) || (mode === 'new' && !stageName)}
          >
            <Send size={14} /> {submitting ? 'Versturen…' : 'Verstuur uitnodiging'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevokeDialog({
  artist,
  onClose,
  onSuccess,
}: {
  artist: ArtistRow
  onClose: () => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/artists/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist_id: artist.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? `Fout (${res.status})`)
        return
      }
      toast.success(`${artist.stage_name} heeft geen portaal-toegang meer.`)
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toegang intrekken</DialogTitle>
          <DialogDescription>
            Weet je zeker dat <strong>{artist.stage_name}</strong> geen toegang meer heeft tot het
            portaal? Het account blijft bestaan maar er kan niet meer mee ingelogd worden als
            artiest.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Toch niet
          </Button>
          <Button variant="danger" onClick={submit} disabled={submitting}>
            {submitting ? 'Bezig…' : 'Toegang intrekken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
