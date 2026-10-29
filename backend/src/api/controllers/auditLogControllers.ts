import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { auditLogServices } from '../../services';
import { auditLogQuerySchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/audit-logs (admin only) */
export const listAuditLogs = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = auditLogQuerySchema.parse(req.query);
  const logs = await auditLogServices.listAuditLogs(query);
  return ok(res, { logs });
});

/** GET /api/audit-logs/entity/:entityType/:entityId (admin only) */
export const listAuditLogsForEntity = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const entityType = String(req.params.entityType);
  const entityId = parseId(req.params.entityId);
  const logs = await auditLogServices.listAuditLogsForEntity(entityType, entityId);
  return ok(res, { logs });
});

export default { listAuditLogs, listAuditLogsForEntity };
