'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, UserPlus, Send, Copy, Users, Link2, MoreHorizontal, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { useStaffList, type StaffListItem } from './useStaffList'

type StaffProfile = StaffListItem

export function StaffPanel() {
  // Gedeelde crew-lijst (#120): zelfde query/volgorde als voorheen, nu via de hook.
  // refresh() na invite/edit haalt de lijst opnieuw op én werkt de andere consumers bij.
  const { staff, refresh } = useStaffList()
  const [editing, setEditing] = useState<StaffProfile | null>(null)
  const [inviting, setInviting] = useState(false)
  const [sendingLoginId, setSendingLoginId] = useState<string | null>(null)
  const [copyingLoginId, setCopyingLoginId] = useState<string | null>(null)
  const [busyCalId, setBusyCalId] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)
  const [deleting, setDeleting] = useState<StaffProfile | null>(null)

  async function copyLoginLink(p: StaffProfile) {
    setCopyingLoginId(p.id)
    try {
      const res = await fetch(`/api/admin/staff/${p.id}/login-link`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        const msg = data.error ?? `Fout (${res.status})`
        const detail = data.detail && !msg.includes(data.detail) ? `\n${data.detail}` : ''
        toast.error(msg + detail, { duration: 8000 })
        return
      }
      await navigator.clipboard.writeText(data.url)
      toast.success('Inloglink gekopieerd (24 uur geldig). Plak in WhatsApp.')
    } catch {
      toast.error('Kopiëren faalde.')
    } finally {
      setCopyingLoginId(null)
    }
  }

  async function sendLoginLink(p: StaffProfile) {
    if (!p.email) {
      toast.error('Dit crewlid heeft geen e-mailadres. Voeg er eerst een toe.')
      return
    }
    setSendingLoginId(p.id)
    try {
      const res = await fetch(`/api/admin/staff/${p.id}/send-login`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error ?? `Fout (${res.status})`
        const detail = data.detail && !msg.includes(data.detail) ? `\n${data.detail}` : ''
        toast.error(msg + detail, { duration: 8000 })
        return
      }
      toast.success(`Inlog + agenda verstuurd naar ${p.email}.`)
      void refresh()
    } finally {
      setSendingLoginId(null)
    }
  }

  async function copyCalendarLink(p: StaffProfile, rotate = false) {
    setBusyCalId(p.id)
    try {
      const res = await fetch(`/api/admin/staff/${p.id}/calendar-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotate }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        toast.error(data.error ?? `Fout (${res.status})`)
        return
      }
      await navigator.clipboard.writeText(data.url)
      toast.success(
        rotate
          ? 'Nieuwe agenda-link gemaakt en gekopieerd. De oude link werkt niet meer.'
          : 'Agenda-link gekopieerd.'
      )
    } catch {
      toast.error('Kopiëren faalde.')
    } finally {
      setBusyCalId(null)
    }
  }

  async function sendToAllCrew() {
    const withEmail = staff.filter((p) => p.email)
    if (withEmail.length === 0) {
      toast.error('Geen crewleden met een e-mailadres gevonden.')
      return
    }
    setSendingAll(true)
    let succeeded = 0
    let failed = 0
    try {
      for (const p of withEmail) {
        try {
          const res = await fetch(`/api/admin/staff/${p.id}/send-login`, { method: 'POST' })
          if (res.ok) succeeded += 1
          else failed += 1
        } catch {
          failed += 1
        }
      }
      toast.success(`Verstuurd naar ${succeeded} crewleden (${failed} mislukt).`)
      void refresh()
    } finally {
      setSendingAll(false)
    }
  }

  return (
    <>
      <div className="mb-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={sendToAllCrew} disabled={sendingAll || staff.length === 0}>
          <Users size={16} /> {sendingAll ? 'Versturen…' : 'Stuur naar alle crew'}
        </Button>
        <Button onClick={() => setInviting(true)}>
          <UserPlus size={16} /> Crewlid toevoegen
        </Button>
      </div>
      <p className="mb-3 text-sm text-[var(--color-fg-muted)]">
        Crewleden zet u op de planning en krijgen bij een toewijzing bericht per e-mail of WhatsApp.
        Bij toevoegen krijgt een crewlid automatisch een welkomstmail met een inloglink en een
        persoonlijke agenda-link. Met de knop &ldquo;Stuur inlog + agenda&rdquo; kunt u die opnieuw
        versturen.
      </p>
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
                <th className="px-4 py-2">Bericht via</th>
                <th className="px-4 py-2">Inlog</th>
                <th className="px-4 py-2 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((p) => {
                const hasPhone = !!p.phone?.trim()
                return (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3 text-[var(--color-fg)]">{p.full_name ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{p.email ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--color-fg-secondary)]">{p.phone ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          hasPhone
                            ? 'bg-[var(--color-surface-2)] text-[var(--color-fg-secondary)]'
                            : 'bg-[var(--color-surface-1)] text-[var(--color-fg-muted)]'
                        }`}
                      >
                        {hasPhone ? 'E-mail en WhatsApp' : 'Alleen e-mail'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          p.has_password
                            ? 'bg-[var(--color-surface-2)] text-[var(--color-fg-secondary)]'
                            : 'bg-[var(--color-surface-1)] text-[var(--color-fg-muted)]'
                        }`}
                      >
                        {p.has_password ? 'Heeft wachtwoord' : 'Nog niet ingelogd'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                busyCalId === p.id ||
                                copyingLoginId === p.id ||
                                sendingLoginId === p.id
                              }
                              title="Inlog- en agenda-acties"
                            >
                              <MoreHorizontal size={16} /> Acties
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => copyCalendarLink(p)}>
                              <Copy size={14} /> Kopieer agenda-link
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => copyCalendarLink(p, true)}>
                              <RefreshCw size={14} /> Vernieuw agenda-link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => copyLoginLink(p)}>
                              <Link2 size={14} /> Kopieer inloglink
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!p.email}
                              onSelect={() => sendLoginLink(p)}
                            >
                              <Send size={14} /> Stuur inlog + agenda
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setDeleting(p)}
                              className="text-[var(--color-danger)] focus:bg-red-50"
                            >
                              <Trash2 size={14} /> Crewlid verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                          <Pencil size={14} /> Bewerken
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
          void refresh()
        }}
      />

      <InviteStaffDialog
        open={inviting}
        onOpenChange={setInviting}
        onSuccess={() => {
          setInviting(false)
          void refresh()
        }}
      />

      <DeleteStaffDialog
        profile={deleting}
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onDeleted={() => {
          setDeleting(null)
          void refresh()
        }}
      />
    </>
  )
}

function DeleteStaffDialog({
  profile,
  open,
  onOpenChange,
  onDeleted,
}: {
  profile: StaffProfile | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onDeleted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  async function confirmDelete() {
    if (!profile) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/staff/' + profile.id, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error ?? `Fout (${res.status})`
        const detail = data.detail && !msg.includes(data.detail) ? `\n${data.detail}` : ''
        toast.error(msg + detail, { duration: 8000 })
        return
      }
      toast.success(
        `${profile.full_name ?? 'Crewlid'} verwijderd. Login ingetrokken en persoonlijke agenda opgeruimd.`
      )
      onDeleted()
    } catch {
      toast.error('Verwijderen faalde.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[var(--color-danger)]" />
            Crewlid verwijderen
          </DialogTitle>
          <DialogDescription>
            Weet u zeker dat u <strong>{profile?.full_name ?? 'dit crewlid'}</strong> wilt verwijderen?
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-fg-secondary)]">
          <li>· Verdwijnt uit de crew-lijst en de agenda.</li>
          <li>· Kan niet meer inloggen (inlog- en agenda-link ingetrokken).</li>
          <li>· Toekomstige toewijzingen worden verwijderd.</li>
          <li>· De persoonlijke Google-agenda wordt verwijderd.</li>
          <li>· Op afgeronde klussen blijft bewaard dat dit crewlid erbij was.</li>
        </ul>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={submitting}>
            <Trash2 size={14} /> {submitting ? 'Verwijderen…' : 'Definitief verwijderen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      const mailStatus =
        data.mailSent
          ? 'Welkomstmail (inlog + agenda) verstuurd.'
          : 'Let op: de welkomstmail kon niet worden verstuurd (mailservice uit). Gebruik "Stuur inlog + agenda" zodra dat weer kan.'
      if (data.reused) toast.success(`${fullName} stond al in het systeem, nu als crewlid gezet. ${mailStatus}`)
      else toast.success(`${fullName} is toegevoegd. ${mailStatus}`)
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
            Voeg een crewlid toe om mee te plannen. Het is daarna meteen toewijsbaar aan shows en
            krijgt bij een toewijzing bericht. Er volgt automatisch een welkomstmail met een
            inloglink en een persoonlijke agenda-link. Vul een telefoonnummer in om ook via
            WhatsApp te kunnen berichten.
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
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setEmail(profile?.email ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  async function save() {
    if (!profile) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/staff/' + profile.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error ?? `Fout (${res.status})`
        const detail = data.detail && !msg.includes(data.detail) ? `\n${data.detail}` : ''
        toast.error(msg + detail, { duration: 8000 })
        return
      }
      toast.success('Profiel bijgewerkt.')
      onSaved()
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
            Pas naam, e-mail en telefoon van dit crewlid aan.
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
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
