import { Router } from 'express';

import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import companyRoutes from './companyRoutes';
import jobRoutes from './jobRoutes';
import skillRoutes from './skillRoutes';
import applicationRoutes from './applicationRoutes';
import interviewRoutes from './interviewRoutes';

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

export default router;
