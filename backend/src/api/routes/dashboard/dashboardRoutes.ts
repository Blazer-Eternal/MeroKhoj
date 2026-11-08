import { Router } from 'express';
import adminDashboardRoutes from './adminDashboardRoutes';
import employerDashboardRoutes from './employerDashboardRoutes';
import jobseekerDashboardRoutes from './jobseekerDashboardRoutes';

const router = Router();

/**
 * /api/dashboard — one sub-router per dashboard area, each behind its own
 * role guard so cross-area callers are rejected at the route, not the service.
 */
router.use('/jobseeker', jobseekerDashboardRoutes);
router.use('/employer', employerDashboardRoutes);
router.use('/admin', adminDashboardRoutes);

export default router;
