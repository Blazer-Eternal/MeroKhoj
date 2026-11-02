import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { savedJobServices } from '../../../services';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/saved-jobs */
export const listSavedJobs = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const savedJobs = await savedJobServices.listSavedJobs(req.user!);
  return ok(res, { saved_jobs: savedJobs });
});

/** POST /api/saved-jobs  { job_id } */
export const saveJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.body?.job_id);
  const savedJob = await savedJobServices.saveJob(req.user!, jobId);
  return ok(res, { saved_job: savedJob }, 201);
});

/** DELETE /api/saved-jobs/:jobId */
export const unsaveJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  await savedJobServices.unsaveJob(req.user!, jobId);
  return ok(res, { message: 'Job removed from saved jobs' });
});

/** GET /api/saved-jobs/:jobId/status → { saved: boolean } */
export const getSavedStatus = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const saved = await savedJobServices.isJobSaved(req.user!, jobId);
  return ok(res, { saved });
});

export default { listSavedJobs, saveJob, unsaveJob, getSavedStatus };
