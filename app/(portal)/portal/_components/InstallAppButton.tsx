'use client'

import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'

// Het 'beforeinstallprompt'-event staat niet in de standaard TS-lib, dus een
// minimaal eigen type. Chrome/Edge (Android/desktop) vuren dit; Safari niet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Knop waarmee gebruikers de portal als app op hun beginscherm zetten.
 * Zichtbaar voor alle rollen (admin, crew, artiest). Verschijnt alleen als
 * installeren mogelijk is: gedraagt zich stil (rendert niets) wanneer de app
 * al als app draait of installeren niet ondersteund wordt.
 */
export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Draait de app al als app? Dan is de knop overbodig.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) {
      setHidden(true)
      return
    }

    // iOS/Safari kent geen install-prompt: daar tonen we een korte uitleg.
    const ua = window.navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) {
      setIsIos(true)
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setInstallEvent(null)
      setHidden(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  // Al als app in gebruik, of niets te installeren: geen loze knop tonen.
  if (hidden) return null
  if (!installEvent && !isIos) return null

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setHidden(true)
  }

  const buttonClass =
    'group flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-[var(--color-fg-on-dark-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-fg-on-dark)]'

  return (
    <>
      <button
        type="button"
        onClick={installEvent ? handleInstall : () => setShowIosHelp(true)}
        className={buttonClass}
      >
        <Download size={13} className="shrink-0" />
        <span className="flex-1 text-left">Zet op beginscherm</span>
      </button>

      {isIos && (
        <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
          <DialogContent className="text-[var(--color-fg)]">
            <DialogHeader>
              <DialogTitle>Zet op beginscherm</DialogTitle>
              <DialogDescription>
                Voeg de portal toe als app-icoon op je iPhone of iPad.
              </DialogDescription>
            </DialogHeader>
            <ol className="flex flex-col gap-3 text-sm text-[var(--color-fg)]">
              <li className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-surface-1)] text-xs font-semibold">
                  1
                </span>
                <span className="flex items-center gap-1.5 pt-0.5">
                  Tik onderin op het Deel-icoon
                  <Share size={15} className="inline shrink-0 text-[var(--color-primary)]" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-surface-1)] text-xs font-semibold">
                  2
                </span>
                <span className="pt-0.5">
                  Kies <strong className="font-semibold">&lsquo;Zet op beginscherm&rsquo;</strong>.
                </span>
              </li>
            </ol>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
