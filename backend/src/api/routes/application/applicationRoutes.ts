import { Router } from 'express';
import { applicationControllers } from '../../controllers';
import { requireAuth, requireEmployer, requireAdmin, validate } from '../../../middleware';
import { changeApplicationStatusSchema, withdrawApplicationSchema } from '../../../validators';

const router = Router();

/** /api/applications — all routes require authentication. */
router.use(requireAuth);

// Admin: platform-wide list (every company's pipeline).
router.get('/', requireAdmin, applicationControllers.listAllApplications);

router.get('/mine', applicationControllers.listMyApplications);
router.get('/:id', applicationControllers.getApplication);
router.get('/:id/history', applicationControllers.getApplicationHistory);

// Employer-side status transition.
router.patch(
  '/:id/status',
  requireEmployer,
  validate({ body: changeApplicationStatusSchema }),
  applicationControllers.changeStatus,
);

// Candidate withdrawal.
router.post(
  '/:id/withdraw',
  validate({ body: withdrawApplicationSchema }),
  applicationControllers.withdraw,
);

export default router;
