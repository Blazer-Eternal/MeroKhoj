import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { applicationAnswerServices } from '../../../services';
import { submitAnswersSchema } from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/applications/:id/answers (applicant; upserted per question) */
export const submitAnswers = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const applicationId = parseId(req.params.id);
  const input = submitAnswersSchema.parse(req.body);
  const answers = await applicationAnswerServices.submitAnswers(
    req.user!,
    applicationId,
    input.answers,
  );
  return ok(res, { answers });
});

/** GET /api/applications/:id/answers (applicant or company member) */
export const listAnswers = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const applicationId = parseId(req.params.id);
  const answers = await applicationAnswerServices.listAnswers(req.user!, applicationId);
  return ok(res, { answers });
});

export default { submitAnswers, listAnswers };
