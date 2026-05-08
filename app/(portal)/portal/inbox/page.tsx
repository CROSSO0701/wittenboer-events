import { redirect } from 'next/navigation'

// Alias-route. /portal/inbox stuurt door naar de admin-inbox.
export default function InboxAliasPage() {
  redirect('/portal/admin')
}
