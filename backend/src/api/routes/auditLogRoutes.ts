import { Router } from 'express';
import { auditLogControllers } from '../controllers';
import { requireAuth, requireAdmin } from '../../middleware';

const router = Router();

/**
 * /api/audit-logs
 * Immutable audit trail — admin-only read access. Entries are written by
 * services (recordAudit) and can never be modified or deleted.
 */
router.use(requireAuth, requireAdmin);

router.get('/', auditLogControllers.listAuditLogs);
router.get('/entity/:entityType/:entityId', auditLogControllers.listAuditLogsForEntity);

export default router;
