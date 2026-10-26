import { Router } from 'express';
import { interviewControllers } from '../controllers';
import { requireAuth, requireEmployer, validate } from '../../middleware';
import {
  scheduleInterviewSchema,
  updateInterviewSchema,
  changeInterviewStatusSchema,
} from '../../validators';

const router = Router();

/** /api/interviews — all routes require authentication. */
router.use(requireAuth);

router.post('/', requireEmployer, validate({ body: scheduleInterviewSchema }), interviewControllers.scheduleInterview);
router.get('/:id', interviewControllers.getInterview);
router.patch('/:id', validate({ body: updateInterviewSchema }), interviewControllers.updateInterview);
router.patch(
  '/:id/status',
  validate({ body: changeInterviewStatusSchema }),
  interviewControllers.changeInterviewStatus,
);

export default router;
