import { Router } from 'express';
import { industryControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { createIndustrySchema, updateIndustrySchema } from '../../validators';

const router = Router();

/** Industry routes (public read; admin write). */
router.get('/', industryControllers.listIndustries);
router.get('/:id', industryControllers.getIndustry);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: createIndustrySchema }),
  industryControllers.createIndustry,
);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ body: updateIndustrySchema }),
  industryControllers.updateIndustry,
);
router.delete('/:id', requireAuth, requireAdmin, industryControllers.deleteIndustry);

export default router;
