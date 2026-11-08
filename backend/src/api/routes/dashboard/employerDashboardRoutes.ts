import { Router } from 'express';
import { employerDashboardControllers } from '../../controllers';
import { requireAuth, requireEmployer } from '../../../middleware';

const router = Router();

/** /api/dashboard/employer */
router.get('/', requireAuth, requireEmployer, employerDashboardControllers.getDashboard);

export default router;
