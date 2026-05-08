'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export function GoogleConnectedBanner() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 8000)
    return () => window.clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-900">Klaar.</p>
          <p className="text-sm text-emerald-800">
            Vanaf nu komen geaccepteerde aanvragen automatisch in je Google Agenda.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Sluit"
        className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100"
      >
        <X size={16} />
      </button>
    </div>
  )
}
