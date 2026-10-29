import { Router } from 'express';
import { companyVerificationControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { reviewVerificationSchema } from '../../validators';

const router = Router();

/**
 * /api/admin/verifications
 * Admin-only company verification review queue.
 */
router.use(requireAuth, requireAdmin);

router.get('/pending', companyVerificationControllers.listPendingVerifications);
router.patch(
  '/:id/review',
  validate({ body: reviewVerificationSchema }),
  companyVerificationControllers.reviewVerification,
);

export default router;
