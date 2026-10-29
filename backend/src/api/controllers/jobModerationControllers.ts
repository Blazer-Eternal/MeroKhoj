import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { jobModerationServices } from '../../services';
import { moderateJobSchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/admin/jobs/:jobId/moderate */
export const moderateJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const input = moderateJobSchema.parse(req.body);
  const result = await jobModerationServices.moderateJob(req.user!, jobId, input);
  return ok(res, result);
});

/** GET /api/admin/jobs/:jobId/moderation-history */
export const listModerationHistory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const history = await jobModerationServices.listModerationHistory(req.user!, jobId);
  return ok(res, { history });
});

/** GET /api/jobs/:jobId/moderation/latest (job owner or admin can check state) */
export const getLatestModeration = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const moderation = await jobModerationServices.getLatestModeration(jobId);
  return ok(res, { moderation });
});

export default { moderateJob, listModerationHistory, getLatestModeration };
