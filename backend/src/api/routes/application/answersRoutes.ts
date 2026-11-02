import { Router } from 'express';
import { applicationAnswersControllers } from '../../controllers';
import { requireAuth, validate } from '../../../middleware';
import { submitAnswersSchema } from '../../../validators';

const router = Router();

/**
 * Application answers (entity 21). Mounted at /applications.
 *
 * Auth only — the service enforces applicant-or-company access:
 *   POST /applications/:id/answers  → the applicant submits/upserts answers
 *   GET  /applications/:id/answers  → applicant or company members read them
 */
router.use(requireAuth);
router.post(
  '/:id/answers',
  validate({ body: submitAnswersSchema }),
  applicationAnswersControllers.submitAnswers,
);
router.get('/:id/answers', applicationAnswersControllers.listAnswers);

export default router;
