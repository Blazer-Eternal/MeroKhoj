import { Router } from 'express';
import { userControllers } from '../../controllers';
import { requireAuth, requireAdmin, validate } from '../../../middleware';
import { setUserStatusSchema } from '../../../validators';

const router = Router();

/**
 * /api/admin/users — platform account directory (admin only).
 * Read + status toggle only; role grants and deletions are deliberately
 * not exposed here.
 */
router.use(requireAuth, requireAdmin);

router.get('/', userControllers.listAdminUsers);
router.patch(
  '/:id/status',
  validate({ body: setUserStatusSchema }),
  userControllers.setAdminUserStatus,
);

export default router;
