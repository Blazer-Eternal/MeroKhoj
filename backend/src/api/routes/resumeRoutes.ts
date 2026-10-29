import { Router } from 'express';
import { resumeControllers } from '../controllers';
import { requireAuth, validate } from '../../middleware';
import { createResumeSchema, updateResumeSchema } from '../../validators';

const router = Router();

/** Resume routes (profile-scoped create; direct update/default/delete). */
router.get('/profiles/:profileId/resumes', requireAuth, resumeControllers.listResumes);
router.post(
  '/profiles/:profileId/resumes',
  requireAuth,
  validate({ body: createResumeSchema }),
  resumeControllers.createResume,
);
router.patch(
  '/resumes/:id',
  requireAuth,
  validate({ body: updateResumeSchema }),
  resumeControllers.updateResume,
);
router.patch('/resumes/:id/default', requireAuth, resumeControllers.setDefaultResume);
router.delete('/resumes/:id', requireAuth, resumeControllers.deleteResume);

export default router;
