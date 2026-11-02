import { Router } from 'express';
import { hiringDecisionControllers } from '../../controllers';
import { requireAuth, validate } from '../../../middleware';
import { makeDecisionSchema } from '../../../validators';

const router = Router();

/**
 * Hiring decisions (entity 23). Mounted at /applications.
 *
 * Auth only — the service enforces employer/admin on the application's company.
 * POST records the decision AND moves the application status in one transaction,
 * appending status history + audit trail. One current decision per application.
 */
router.use(requireAuth);
router.post(
  '/:id/decision',
  validate({ body: makeDecisionSchema }),
  hiringDecisionControllers.makeDecision,
);
router.get('/:id/decision', hiringDecisionControllers.getDecision);

export default router;
