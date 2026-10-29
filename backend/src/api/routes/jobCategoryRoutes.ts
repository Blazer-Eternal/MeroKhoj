import { Router } from 'express';
import { jobCategoryControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { createCategorySchema, updateCategorySchema } from '../../validators';

const router = Router();

/** Job category routes (public read; admin write). */
router.get('/', jobCategoryControllers.listCategories);
router.get('/tree', jobCategoryControllers.getCategoryTree);
router.get('/:id', jobCategoryControllers.getCategory);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: createCategorySchema }),
  jobCategoryControllers.createCategory,
);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ body: updateCategorySchema }),
  jobCategoryControllers.updateCategory,
);
router.delete('/:id', requireAuth, requireAdmin, jobCategoryControllers.deleteCategory);

export default router;
