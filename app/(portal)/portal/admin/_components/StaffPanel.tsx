'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, UserPlus } from 'lucide-react'
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
import { Label } from '../../../../components/ui/label'
import { createSupabaseBrowserClient } from '../../../../lib/db/client'

type StaffProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export function StaffPanel() {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [editing, setEditing] = useState<StaffProfile | null>(null)
  const [inviting, setInviting] = useState(false)

  async function load() {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('role', 'staff')
        .order('full_name', { ascending: true })
      setStaff((data as StaffProfile[]) ?? [])
    } catch {
      setStaff([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setInviting(true)}>
          <UserPlus size={16} /> Crewlid toevoegen
        </Button>
      </div>
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-fg-muted)]">
          Nog geen crewleden. Klik op &ldquo;Crewlid toevoegen&rdquo; om er een toe te voegen.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                <th className="px-4 py-2">Naam</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Telefoon</th>
                <th className="px-4 py-2 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 text-[var(--color-fg)]">{p.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{p.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                      <Pencil size={14} /> Bewerken
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditStaffDialog
        profile={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />

      <InviteStaffDialog
        open={inviting}
        onOpenChange={setInviting}
        onSuccess={() => {
          setInviting(false)
          load()
        }}
      />
    </>
  )
}

function InviteStaffDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone: phone || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error ?? `Fout (${res.status})`
        const detail = data.detail && !msg.includes(data.detail) ? `\n${data.detail}` : ''
        toast.error(msg + detail, { duration: 8000 })
        return
      }
      if (data.reused) toast.success(`${fullName} stond al in het systeem — nu als crewlid gezet.`)
      else toast.success(`${fullName} is toegevoegd als crewlid.`)
      setFullName('')
      setEmail('')
      setPhone('')
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crewlid toevoegen</DialogTitle>
          <DialogDescription>
            Het account wordt direct aangemaakt en is meteen toewijsbaar aan shows.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-name">Naam</Label>
            <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-phone">Telefoon (handig voor WhatsApp)</Label>
            <Input id="invite-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button onClick={submit} disabled={submitting || !fullName || !email}>
            <UserPlus size={14} /> {submitting ? 'Bezig…' : 'Toevoegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditStaffDialog({
  profile,
  open,
  onOpenChange,
  onSaved,
}: {
  profile: StaffProfile | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  async function save() {
    if (!profile) return
    setSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone })
        .eq('id', profile.id)
        .select('id')
      if (error) throw error
      // RLS kan de update stilletjes blokkeren (0 rijen terug). Voorkom een valse succesmelding.
      if (!data || data.length === 0) {
        throw new Error('Geen rechten om dit profiel bij te werken.')
      }
      toast.success('Profiel bijgewerkt.')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bijwerken faalde')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profiel bewerken</DialogTitle>
          <DialogDescription>
            {profile?.email ?? 'Pas naam en telefoonnummer aan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Naam</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button onClick={save} disabled={submitting}>
            {submitting ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
