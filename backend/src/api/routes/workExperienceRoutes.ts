import { Router } from 'express';
import { workExperienceControllers } from '../controllers';
import { requireAuth, validate } from '../../middleware';
import { createExperienceSchema, updateExperienceSchema } from '../../validators';

const router = Router();

/** Work experience routes (profile-scoped create; direct update/delete). */
router.get(
  '/profiles/:profileId/work-experiences',
  requireAuth,
  workExperienceControllers.listExperiences,
);
router.post(
  '/profiles/:profileId/work-experiences',
  requireAuth,
  validate({ body: createExperienceSchema }),
  workExperienceControllers.createExperience,
);
router.patch(
  '/work-experiences/:id',
  requireAuth,
  validate({ body: updateExperienceSchema }),
  workExperienceControllers.updateExperience,
);
router.delete('/work-experiences/:id', requireAuth, workExperienceControllers.deleteExperience);

export default router;
