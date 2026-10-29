import { Op } from 'sequelize';
import AuditLog from '../models/auditLogModel';
import { IAuditLog, IAuditLogCreation, IAuditLogQuery } from '../interfaces';
import { plain } from '../utils';

/**
 * Data-access layer for the `audit_logs` table (append-only).
 * There are intentionally no update/destroy methods.
 */
class AuditLogRepository {
  async create(payload: IAuditLogCreation): Promise<IAuditLog> {
    const row = await AuditLog.create(payload);
    return plain(row) as IAuditLog;
  }

  /** Query the audit trail with optional filters, newest first. */
  async list(query: IAuditLogQuery): Promise<IAuditLog[]> {
    const where: Record<string, unknown> = {};
    if (query.user_id) where.user_id = query.user_id;
    if (query.action) where.action = query.action;
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.entity_id) where.entity_id = query.entity_id;

    const rows = await AuditLog.findAll({ where, order: [['created_at', 'DESC']] });
    return plain<IAuditLog[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Audit entries for a specific entity (e.g. one job or one application). */
  async listByEntity(entityType: string, entityId: string): Promise<IAuditLog[]> {
    const rows = await AuditLog.findAll({
      where: { entity_type: entityType, entity_id: entityId },
      order: [['created_at', 'DESC']],
    });
    return plain<IAuditLog[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Count entries (for lightweight stats). */
  async count(query: IAuditLogQuery): Promise<number> {
    const where: Record<string, unknown> = {};
    if (query.user_id) where.user_id = query.user_id;
    if (query.action) where.action = query.action;
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.entity_id) where.entity_id = query.entity_id;
    return AuditLog.count({ where });
  }
}

export default new AuditLogRepository();
