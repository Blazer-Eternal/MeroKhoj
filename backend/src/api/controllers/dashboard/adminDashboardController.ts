import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { adminDashboardServices } from '../../../services';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/dashboard/admin — platform counters and breakdowns. */
export const getDashboard = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const dashboard = await adminDashboardServices.getDashboard();
  return ok(res, { dashboard });
});

export default { getDashboard };
