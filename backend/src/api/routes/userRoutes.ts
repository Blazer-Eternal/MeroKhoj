import { Router } from 'express';
import { userControllers } from '../controllers';
import { requireAuth, requireJobseeker } from '../../middleware';

const router = Router();

/**
 * /api/users
 * Self-service account + jobseeker-profile routes. All require authentication.
 */
router.use(requireAuth);

router.get('/me', userControllers.getMe);
router.patch('/me', userControllers.updateMe);
router.patch('/me/password', userControllers.changePassword);

// Jobseeker professional profile (only meaningful for jobseeker accounts).
router.get('/me/profile', requireJobseeker, userControllers.getMyJobseekerProfile);
router.put('/me/profile', requireJobseeker, userControllers.upsertMyJobseekerProfile);

export default router;
