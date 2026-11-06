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
  questionsRoutes,
} from './job';
import { applicationRoutes, answersRoutes } from './application';
import { interviewRoutes, feedbackRoutes } from './interview';
import { hiringDecisionRoutes } from './hiring';
import { talentRosterRoutes } from './talent';
import { savedJobRoutes, jobAlertRoutes, notificationRoutes } from './notification';
import { jobModerationRoutes, reportRoutes, auditLogRoutes } from './administration';
import { servicePlanRoutes, orderRoutes, invoiceRoutes, paymentRoutes } from './payment';

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
// Questions router spans /jobs/:jobId/questions + /questions/:id, so it mounts
// at '/'. Must stay BEFORE talentRosterRoutes (also at '/'), which 401s every
// unmatched path behind its root auth guard.
router.use('/', questionsRoutes);
// Billing (Phase 5): paymentRoutes also spans several prefixes —
// /orders/:id/payments, /payments/* and /companies/:id/entitlement — so it
// mounts at '/' here, also BEFORE talentRosterRoutes' root guard. Its auth
// guard is path-scoped, so routes mounted below stay unaffected.
router.use('/', paymentRoutes);
router.use('/service-plans', servicePlanRoutes);
router.use('/orders', orderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/skills', skillRoutes);
router.use('/applications', applicationRoutes);
router.use('/applications', answersRoutes);
router.use('/applications', hiringDecisionRoutes);
router.use('/interviews', interviewRoutes);
router.use('/interviews', feedbackRoutes);
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
