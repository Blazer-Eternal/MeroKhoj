import { Router } from 'express';
import { orderControllers } from '../../controllers';
import { requireAuth, requireEmployer } from '../../../middleware';

const router = Router();

/**
 * /api/orders
 * Authenticated employers/admins only. Company scoping (member-or-admin)
 * is enforced in the service layer; platform admins see every order.
 */
router.use(requireAuth, requireEmployer);

router.post('/', orderControllers.createOrder);
router.get('/', orderControllers.listOrders);
router.get('/:id', orderControllers.getOrder);
router.post('/:id/cancel', orderControllers.cancelOrder);

export default router;
