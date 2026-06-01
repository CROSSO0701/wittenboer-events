import { redirect } from 'next/navigation'

// "Aanvragen" is samengevoegd met "Te doen" op /portal/admin.
// Oude links blijven werken via deze redirect.
export default function AanvragenPage() {
  redirect('/portal/admin')
}
