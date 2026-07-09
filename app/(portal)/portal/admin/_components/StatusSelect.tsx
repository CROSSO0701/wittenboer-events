'use client'

import { INQUIRY_STATUS_LABEL } from '../../../../lib/format'

/**
 * Gedeelde status-dropdown voor aanvragen.
 * Toont NL-labels (via `labels`), maar houdt de Engelse enum-waarde als
 * `value` aan zodat de API-calls ongewijzigd blijven.
 * Vervangt de twee identieke lokale kopieën in AanvragenOverzicht en
 * InquiriesPanel.
 */
export function StatusSelect({
  value,
  options,
  onChange,
  labels = INQUIRY_STATUS_LABEL,
}: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  labels?: Record<string, string>
}) {
  return (
    <select
      aria-label="Status wijzigen"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-[var(--color-border)] bg-white px-2 text-xs focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels[o] ?? o}
        </option>
      ))}
    </select>
  )
}
