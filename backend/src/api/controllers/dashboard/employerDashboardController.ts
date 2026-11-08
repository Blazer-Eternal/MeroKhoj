import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { employerDashboardServices } from '../../../services';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/dashboard/employer — funnel, schedule, postings, applicants. */
export const getDashboard = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const dashboard = await employerDashboardServices.getDashboard(req.user!);
  return ok(res, { dashboard });
});

export default { getDashboard };
