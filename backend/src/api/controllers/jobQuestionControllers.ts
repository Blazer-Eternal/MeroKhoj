import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { jobQuestionServices } from '../../services';
import {
  createQuestionSchema,
  updateQuestionSchema,
  setOptionsSchema,
} from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/jobs/:jobId/questions */
export const listQuestions = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const questions = await jobQuestionServices.listQuestions(req.user!, jobId);
  return ok(res, { questions });
});

/** POST /api/jobs/:jobId/questions (employer/admin) */
export const createQuestion = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const input = createQuestionSchema.parse(req.body);
  const question = await jobQuestionServices.createQuestion(req.user!, jobId, input);
  return ok(res, { question }, 201);
});

/** PATCH /api/questions/:id (employer/admin) */
export const updateQuestion = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateQuestionSchema.parse(req.body);
  const question = await jobQuestionServices.updateQuestion(req.user!, id, input);
  return ok(res, { question });
});

/** DELETE /api/questions/:id (employer/admin) */
export const deleteQuestion = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await jobQuestionServices.deleteQuestion(req.user!, id);
  return ok(res, { message: 'Question deleted' });
});

/** PUT /api/questions/:id/options (employer/admin) */
export const setOptions = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = setOptionsSchema.parse(req.body);
  const options = await jobQuestionServices.setOptions(req.user!, id, input.options);
  return ok(res, { options });
});

/** GET /api/questions/:id/options (employer/admin) */
export const listOptions = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const options = await jobQuestionServices.listOptions(req.user!, id);
  return ok(res, { options });
});

export default {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  setOptions,
  listOptions,
};
