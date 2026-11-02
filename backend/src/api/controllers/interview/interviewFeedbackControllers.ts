import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { interviewFeedbackServices } from '../../../services';
import { submitFeedbackSchema, updateFeedbackSchema } from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/interviews/:id/feedback (company member; one row per reviewer) */
export const submitFeedback = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const interviewId = parseId(req.params.id);
  const input = submitFeedbackSchema.parse(req.body);
  const feedback = await interviewFeedbackServices.submitFeedback(req.user!, interviewId, input);
  return ok(res, { feedback });
});

/** GET /api/interviews/:id/feedback (all feedback on the interview) */
export const listFeedback = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const interviewId = parseId(req.params.id);
  const feedback = await interviewFeedbackServices.listFeedback(req.user!, interviewId);
  return ok(res, { feedback });
});

/** GET /api/interviews/:id/feedback/mine (the caller's own feedback) */
export const getMyFeedback = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const interviewId = parseId(req.params.id);
  const feedback = await interviewFeedbackServices.getMyFeedback(req.user!, interviewId);
  return ok(res, { feedback });
});

/** PATCH /api/interviews/:id/feedback/:feedbackId (original reviewer only) */
export const updateFeedback = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const feedbackId = parseId(req.params.feedbackId);
  const input = updateFeedbackSchema.parse(req.body);
  const feedback = await interviewFeedbackServices.updateFeedback(req.user!, feedbackId, input);
  return ok(res, { feedback });
});

/** DELETE /api/interviews/:id/feedback/:feedbackId (reviewer or admin) */
export const deleteFeedback = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const feedbackId = parseId(req.params.feedbackId);
  await interviewFeedbackServices.deleteFeedback(req.user!, feedbackId);
  return ok(res, { message: 'Feedback deleted' });
});

export default { submitFeedback, listFeedback, getMyFeedback, updateFeedback, deleteFeedback };
