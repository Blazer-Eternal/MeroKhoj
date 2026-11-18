import { Router } from 'express';
import { analyticsControllers } from '../../controllers';
import { requireAuth, requireEmployer, requireAdmin, validate } from '../../../middleware';
import { recruitmentAnalyticsQuerySchema, salaryEstimateQuerySchema } from '../../../validators';

const router = Router();

/**
 * /api/analytics — Phase 1 recruitment intelligence.
 * Salary insights are public; everything else needs an authenticated employer
 * (company scope is authorized in the controller) or an admin.
 */
router.get(
  '/salary-estimate',
  validate({ query: salaryEstimateQuerySchema }),
  analyticsControllers.salaryEstimate,
);
router.get(
  '/recruitment',
  requireAuth,
  requireEmployer,
  validate({ query: recruitmentAnalyticsQuerySchema }),
  analyticsControllers.recruitment,
);
router.get('/jobs/:jobId', requireAuth, requireEmployer, analyticsControllers.jobAnalytics);
router.get('/platform', requireAuth, requireAdmin, analyticsControllers.platform);

export default router;
