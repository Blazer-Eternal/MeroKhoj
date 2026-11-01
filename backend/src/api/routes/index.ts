import { Router } from 'express';

import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import companyRoutes from './companyRoutes';
import jobRoutes from './jobRoutes';
import skillRoutes from './skillRoutes';
import applicationRoutes from './applicationRoutes';
import interviewRoutes from './interviewRoutes';
import educationRoutes from './educationRoutes';
import workExperienceRoutes from './workExperienceRoutes';
import resumeRoutes from './resumeRoutes';
import jobCategoryRoutes from './jobCategoryRoutes';
import industryRoutes from './industryRoutes';
import locationRoutes from './locationRoutes';
import companyVerificationRoutes from './companyVerificationRoutes';
import jobModerationRoutes from './jobModerationRoutes';
import reportRoutes from './reportRoutes';
import auditLogRoutes from './auditLogRoutes';
import savedJobRoutes from './savedJobRoutes';
import jobAlertRoutes from './jobAlertRoutes';
import notificationRoutes from './notificationRoutes';
import talentRosterRoutes from './talentRosterRoutes';

/**
 * Central route hub mounted under /api.
 * Every domain router is namespaced here so app.ts stays a single line.
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
