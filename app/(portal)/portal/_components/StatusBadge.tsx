import { Badge } from '../../../components/ui/badge'

const LABELS: Record<string, string> = {
  pending: 'Aangevraagd',
  accepted: 'Ingepland',
  declined: 'Afgewezen',
  done: 'Geweest',
  cancelled: 'Geannuleerd',
}

export function StatusBadge({ status }: { status: string }) {
  const tone = (
    status === 'pending' || status === 'accepted' || status === 'declined' || status === 'done' || status === 'cancelled'
      ? status
      : 'neutral'
  ) as 'pending' | 'accepted' | 'declined' | 'done' | 'cancelled' | 'neutral'
  return <Badge tone={tone}>{LABELS[status] ?? status}</Badge>
}
