import { Router } from 'express';
import { jobModerationControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { moderateJobSchema } from '../../validators';

const router = Router();

/**
 * /api/admin/moderation
 * Admin/moderator-only job moderation. Each action updates the job status in
 * the same transaction and appends to the moderation history.
 */
router.use(requireAuth, requireAdmin);

router.post(
  '/jobs/:jobId',
  validate({ body: moderateJobSchema }),
  jobModerationControllers.moderateJob,
);
router.get('/jobs/:jobId/history', jobModerationControllers.listModerationHistory);

export default router;
