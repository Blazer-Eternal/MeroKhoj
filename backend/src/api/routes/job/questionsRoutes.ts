import { Router } from 'express';
import { jobQuestionControllers } from '../../controllers';
import { requireAuth, validate } from '../../../middleware';
import {
  createQuestionSchema,
  updateQuestionSchema,
  setOptionsSchema,
} from '../../../validators';

const router = Router();

/**
 * Job screening questions (entities 19-20).
 *
 * Paths span two prefixes (`/jobs/:jobId/questions` + `/questions/:id`), so this
 * router is mounted at `/` in the route hub (STRUCTURE.md §6.5).
 *
 * - GET /jobs/:jobId/questions is PUBLIC for published jobs — jobseekers preview
 *   the application form before applying; non-published jobs require company rights.
 * - Every write requires authentication; the service enforces company management
 *   rights (owner/employer/admin) per question.
 */
router.get('/jobs/:jobId/questions', jobQuestionControllers.listQuestions);
router.post(
  '/jobs/:jobId/questions',
  requireAuth,
  validate({ body: createQuestionSchema }),
  jobQuestionControllers.createQuestion,
);
router.patch(
  '/questions/:id',
  requireAuth,
  validate({ body: updateQuestionSchema }),
  jobQuestionControllers.updateQuestion,
);
router.delete('/questions/:id', requireAuth, jobQuestionControllers.deleteQuestion);
router.put(
  '/questions/:id/options',
  requireAuth,
  validate({ body: setOptionsSchema }),
  jobQuestionControllers.setOptions,
);
router.get('/questions/:id/options', requireAuth, jobQuestionControllers.listOptions);

export default router;
