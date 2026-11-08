import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { jobseekerDashboardServices } from '../../../services';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/dashboard/jobseeker — counters, profile progress, job feed. */
export const getDashboard = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const dashboard = await jobseekerDashboardServices.getDashboard(req.user!);
  return ok(res, { dashboard });
});

export default { getDashboard };
