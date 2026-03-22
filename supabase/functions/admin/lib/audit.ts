import type { AdminPrincipal, SupabaseClient } from './auth.ts'

interface AuditRecord {
  requestId: string
  principal: AdminPrincipal
  action: string
  targetType?: string
  targetId?: string
  status?: 'success' | 'error'
}

/**
 * Enregistre une mutation admin dans admin_action_audit.
 * Fire-and-forget : les erreurs d'audit ne bloquent jamais la réponse principale.
 */
export async function recordAdminAction(
  supabase: SupabaseClient,
  record: AuditRecord,
): Promise<void> {
  try {
    await supabase.from('admin_action_audit').insert({
      request_id: record.requestId,
      admin_user_id: record.principal.userId,
      account_kind: record.principal.accountKind,
      action: record.action,
      target_type: record.targetType ?? null,
      target_id: record.targetId ?? null,
      status: record.status ?? 'success',
    })
  } catch (e) {
    console.warn('[admin:audit] Insert failed:', e instanceof Error ? e.message : e)
  }
}
