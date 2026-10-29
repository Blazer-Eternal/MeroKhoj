import { Router } from 'express';
import { educationControllers } from '../controllers';
import { requireAuth, validate } from '../../middleware';
import { createEducationSchema, updateEducationSchema } from '../../validators';

const router = Router();

/**
 * Education history routes.
 * Profile-scoped creation; direct update/delete by education id.
 * Ownership of the underlying jobseeker profile is enforced in the service.
 */
router.get(
  '/profiles/:profileId/educations',
  requireAuth,
  educationControllers.listEducations,
);
router.post(
  '/profiles/:profileId/educations',
  requireAuth,
  validate({ body: createEducationSchema }),
  educationControllers.createEducation,
);
router.patch(
  '/educations/:id',
  requireAuth,
  validate({ body: updateEducationSchema }),
  educationControllers.updateEducation,
);
router.delete('/educations/:id', requireAuth, educationControllers.deleteEducation);

export default router;
