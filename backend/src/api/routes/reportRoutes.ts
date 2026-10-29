import { Router } from 'express';
import { reportControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { createReportSchema, updateReportStatusSchema } from '../../validators';

const router = Router();

/**
 * /api/reports
 * Any authenticated user can file a report; moderation/triage is admin-only.
 */
router.use(requireAuth);

router.post('/', validate({ body: createReportSchema }), reportControllers.createReport);
router.get('/', requireAdmin, reportControllers.listReports);
router.get('/:id', reportControllers.getReport);
router.patch(
  '/:id/status',
  requireAdmin,
  validate({ body: updateReportStatusSchema }),
  reportControllers.updateReportStatus,
);

export default router;
