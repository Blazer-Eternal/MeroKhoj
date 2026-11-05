import { Router, Request, Response } from 'express';
import { getSequelize } from '../../config';

const router = Router();

/**
 * GET /health
 * Application and database health check.
 */
router.get('/', async (_req: Request, res: Response) => {
  let database: 'up' | 'down' = 'down';

  try {
    await getSequelize().authenticate();
    database = 'up';
  } catch (error) {
    database = 'down';
  }

  const isHealthy = database === 'up';

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'merokhoj-backend',
      database,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;