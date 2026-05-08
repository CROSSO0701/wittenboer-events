import { cn } from '../../lib/utils/cn'

type Tone = 'pending' | 'accepted' | 'declined' | 'done' | 'cancelled' | 'neutral' | 'info'

const TONES: Record<Tone, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)] border-[var(--color-primary)]/30',
  declined: 'bg-red-100 text-red-800 border-red-200',
  done: 'bg-[var(--color-surface-2)] text-[var(--color-fg-secondary)] border-[var(--color-border)]',
  cancelled: 'bg-[var(--color-surface-1)] text-[var(--color-fg-muted)] border-[var(--color-border)]',
  neutral: 'bg-[var(--color-surface-1)] text-[var(--color-fg)] border-[var(--color-border)]',
  info: 'bg-[var(--color-tertiary-soft)] text-[var(--color-secondary-darker)] border-[var(--color-tertiary)]',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
