import { Router } from 'express';

import healthRoutes from './healthRoutes';
import { authRoutes, userRoutes } from './user';
import { educationRoutes, workExperienceRoutes, resumeRoutes } from './jobseeker';
import { companyRoutes, companyVerificationRoutes } from './company';
import {
  jobRoutes,
  jobCategoryRoutes,
  industryRoutes,
  locationRoutes,
  skillRoutes,
} from './job';
import { applicationRoutes } from './application';
import { interviewRoutes } from './interview';
import { talentRosterRoutes } from './talent';
import { savedJobRoutes, jobAlertRoutes, notificationRoutes } from './notification';
import { jobModerationRoutes, reportRoutes, auditLogRoutes } from './administration';

/**
 * Central route hub mounted under /api.
 * Every domain router is namespaced here so app.ts stays a single line.
 *
 * Mount paths are decided ONLY in this file (STRUCTURE.md §6.5).
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/skills', skillRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/', educationRoutes);
router.use('/', workExperienceRoutes);
router.use('/', resumeRoutes);
router.use('/job-categories', jobCategoryRoutes);
router.use('/industries', industryRoutes);
router.use('/locations', locationRoutes);
router.use('/admin/verifications', companyVerificationRoutes);
router.use('/admin/moderation', jobModerationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/saved-jobs', savedJobRoutes);
router.use('/job-alerts', jobAlertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', talentRosterRoutes);

export default router;
