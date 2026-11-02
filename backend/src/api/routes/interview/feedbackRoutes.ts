import { Router } from 'express';
import { interviewFeedbackControllers } from '../../controllers';
import { requireAuth, validate } from '../../../middleware';
import { submitFeedbackSchema, updateFeedbackSchema } from '../../../validators';

const router = Router();

/**
 * Interview feedback (entity 22). Mounted at /interviews.
 *
 * Auth only — the service enforces company membership on the interview's
 * application. One feedback row per reviewer per interview: POST upserts
 * (re-submitting updates the reviewer's existing row).
 */
router.use(requireAuth);
router.post(
  '/:id/feedback',
  validate({ body: submitFeedbackSchema }),
  interviewFeedbackControllers.submitFeedback,
);
router.get('/:id/feedback', interviewFeedbackControllers.listFeedback);
router.get('/:id/feedback/mine', interviewFeedbackControllers.getMyFeedback);
router.patch(
  '/:id/feedback/:feedbackId',
  validate({ body: updateFeedbackSchema }),
  interviewFeedbackControllers.updateFeedback,
);
router.delete('/:id/feedback/:feedbackId', interviewFeedbackControllers.deleteFeedback);

export default router;
