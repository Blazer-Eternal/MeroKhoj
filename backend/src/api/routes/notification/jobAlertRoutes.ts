import { Router } from 'express';
import { jobAlertControllers } from '../../controllers';
import { requireAuth, requireJobseeker, validate } from '../../../middleware';
import { createJobAlertSchema, updateJobAlertSchema } from '../../../validators';

const router = Router();

/**
 * /api/job-alerts
 * Saved searches owned by a jobseeker; the worker dispatches matches.
 */
router.use(requireAuth, requireJobseeker);

router.get('/', jobAlertControllers.listJobAlerts);
router.post('/', validate({ body: createJobAlertSchema }), jobAlertControllers.createJobAlert);
router.get('/:id', jobAlertControllers.getJobAlert);
router.patch(
  '/:id',
  validate({ body: updateJobAlertSchema }),
  jobAlertControllers.updateJobAlert,
);
router.delete('/:id', jobAlertControllers.deleteJobAlert);
router.post('/:id/test', jobAlertControllers.previewMatches);

export default router;
