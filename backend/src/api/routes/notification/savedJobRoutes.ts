import { Router } from 'express';
import { savedJobControllers } from '../../controllers';
import { requireAuth, requireJobseeker } from '../../../middleware';

const router = Router();

/**
 * /api/saved-jobs
 * Jobseeker-only bookmarks. Service layer re-checks the jobseeker profile.
 */
router.use(requireAuth, requireJobseeker);

router.get('/', savedJobControllers.listSavedJobs);
router.post('/', savedJobControllers.saveJob);
router.get('/:jobId/status', savedJobControllers.getSavedStatus);
router.delete('/:jobId', savedJobControllers.unsaveJob);

export default router;
