import 'server-only'
import { createSupabaseAdminClient } from './db/server'

export type AuditAction =
  | 'booking.accepted'
  | 'booking.declined'
  | 'booking.assigned'
  | 'booking.updated'
  | 'booking.cancelled'
  | 'booking.synced'
  | 'integration.google_connected'
  | 'integration.artwinlive_saved'
  | 'note.added'
  | 'artist.invited'
  | 'artist.access_revoked'
  | 'artist.updated'
  | 'artist.deleted'
  | 'staff.invited'
  | 'staff.created'
  | 'klus.created'
  | 'klus.updated'
  | 'klus.deleted'
  | 'klus.assigned'
  | 'availability.created'
  | 'availability.updated'
  | 'availability.deleted'

export async function logAudit(input: {
  actorId?: string | null
  action: AuditAction
  entity: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient()
    await supabase.from('audit_log').insert({
      actor_id: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? null) as never,
    })
  } catch {
    // Non-fatal — audit-write mag handlers nooit blokkeren.
  }
}
