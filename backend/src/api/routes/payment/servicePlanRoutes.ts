import { Router } from 'express';
import { servicePlanControllers } from '../../controllers';
import { requireAuth, requireAdmin, optionalAuth } from '../../../middleware';

const router = Router();

/**
 * /api/service-plans
 * Public catalog: reads are open (non-admins only ever see ACTIVE plans;
 * optionalAuth lets admins see the full catalog on the same routes).
 * Writes are admin-only (workflow rule 1: admin CRUD; deactivation never
 * touches purchased orders — that lives on the orders themselves).
 */
router.get('/', optionalAuth, servicePlanControllers.listPlans);
router.get('/:id', optionalAuth, servicePlanControllers.getPlan);

router.post('/', requireAuth, requireAdmin, servicePlanControllers.createPlan);
router.patch('/:id', requireAuth, requireAdmin, servicePlanControllers.updatePlan);
router.delete('/:id', requireAuth, requireAdmin, servicePlanControllers.deletePlan);

export default router;
