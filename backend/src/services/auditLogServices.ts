import { auditLogRepository } from '../repositories';
import { IAuditLog, IAuditLogCreation, IAuditLogQuery, IAuthUser } from '../interfaces';

/**
 * Audit trail service — records important actions across the platform.
 *
 * Design notes:
 *   - Append-only: there is no update/delete path, by design.
 *   - `user_id` is optional so system-scheduled actions (e.g. job-alert
 *     dispatch) can be recorded without an actor.
 *   - Failures to write an audit row should NOT break the calling operation;
 *     we swallow errors and log them instead.
 */

/** Record an audit entry. Never throws (best-effort). */
export const recordAudit = async (
  entry: Omit<IAuditLogCreation, 'user_id'> & { user_id?: string | null },
): Promise<void> => {
  try {
    await auditLogRepository.create({
      user_id: entry.user_id ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      old_values: entry.old_values ?? null,
      new_values: entry.new_values ?? null,
      ip_address: entry.ip_address ?? null,
    });
  } catch (error) {
    // Audit must never take down the primary operation.
    console.error('[audit] failed to record audit log:', error);
  }
};

/** Convenience wrapper that pulls user_id from the authenticated actor. */
export const recordAuditForUser = async (
  actor: IAuthUser | undefined,
  entry: Omit<IAuditLogCreation, 'user_id'>,
  ipAddress?: string,
): Promise<void> => {
  await recordAudit({
    ...entry,
    user_id: actor?.id ?? null,
    ip_address: ipAddress ?? null,
  });
};

/** Query the audit trail (admin only — enforced at the route level). */
export const listAuditLogs = async (query: IAuditLogQuery): Promise<IAuditLog[]> =>
  auditLogRepository.list(query);

/** Audit entries for a specific entity. */
export const listAuditLogsForEntity = async (
  entityType: string,
  entityId: string,
): Promise<IAuditLog[]> => auditLogRepository.listByEntity(entityType, entityId);

export const auditLogServices = {
  recordAudit,
  recordAuditForUser,
  listAuditLogs,
  listAuditLogsForEntity,
};

export default auditLogServices;
