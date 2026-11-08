import { Router } from 'express';
import { jobseekerDashboardControllers } from '../../controllers';
import { requireAuth, requireJobseeker } from '../../../middleware';

const router = Router();

/** /api/dashboard/jobseeker */
router.get('/', requireAuth, requireJobseeker, jobseekerDashboardControllers.getDashboard);

export default router;
