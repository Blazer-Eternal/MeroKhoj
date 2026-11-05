import { Router } from 'express';
import { jobControllers, applicationControllers, jobModerationControllers } from '../../controllers';
import { requireAuth, requireEmployer, requireJobseeker, validate, applicationLimiter } from '../../../middleware';
import {
  createJobSchema,
  updateJobSchema,
  changeJobStatusSchema,
  setJobSkillsSchema,
  applyToJobSchema,
} from '../../../validators';

const router = Router();

/**
 * /api/jobs
 * Public: search + view. Employer: create/edit/status. Jobseeker: apply.
 */

// Public read endpoints
router.get('/', jobControllers.searchJobs);
router.get('/:id', jobControllers.getJob);
router.get('/:id/skills', jobControllers.getJobSkills);
// Latest moderation decision (job's company or admin — scoped in the service)
router.get('/:jobId/moderation/latest', requireAuth, jobModerationControllers.getLatestModeration);

// Employer write endpoints
router.post('/', requireAuth, requireEmployer, validate({ body: createJobSchema }), jobControllers.createJob);
router.patch('/:id', requireAuth, requireEmployer, validate({ body: updateJobSchema }), jobControllers.updateJob);
router.patch(
  '/:id/status',
  requireAuth,
  requireEmployer,
  validate({ body: changeJobStatusSchema }),
  jobControllers.changeJobStatus,
);
router.put(
  '/:id/skills',
  requireAuth,
  requireEmployer,
  validate({ body: setJobSkillsSchema }),
  jobControllers.setJobSkills,
);
router.delete('/:id', requireAuth, requireEmployer, jobControllers.deleteJob);

// Jobseeker: apply to a job
router.post(
  '/:jobId/applications',
  requireAuth,
  requireJobseeker,
  applicationLimiter,
  validate({ body: applyToJobSchema }),
  applicationControllers.applyToJob,
);

export default router;
