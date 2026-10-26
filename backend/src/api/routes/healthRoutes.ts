import { Router, Request, Response } from 'express';
import { getSequelize } from '../../config';

const router = Router();

/** GET /health — liveness + database reachability probe. */
router.get('/', async (_req: Request, res: Response) => {
  let database: 'up' | 'down' = 'down';
  try {
    await getSequelize().authenticate();
    database = 'up';
  } catch {
    database = 'down';
  }

  res.status(database === 'up' ? 200 : 503).json({
    success: database === 'up',
    data: {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'merokhoj-backend',
      database,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
