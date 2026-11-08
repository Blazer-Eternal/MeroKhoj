import { Router } from 'express';
import { adminDashboardControllers } from '../../controllers';
import { requireAuth, requireAdmin } from '../../../middleware';

const router = Router();

/** /api/dashboard/admin */
router.get('/', requireAuth, requireAdmin, adminDashboardControllers.getDashboard);

export default router;
