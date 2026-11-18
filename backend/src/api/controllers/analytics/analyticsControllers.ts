import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import {
  companyAnalyticsService,
  jobAnalyticsService,
  recruitmentAnalyticsService,
  salaryEstimationService,
} from '../../../services';
import { resolveCompanyForUser } from '../../../services/shared/accessControl';
import {
  recruitmentAnalyticsQuerySchema,
  salaryEstimateQuerySchema,
} from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/analytics/salary-estimate — public salary insights. */
export const salaryEstimate = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = salaryEstimateQuerySchema.parse(req.query);
  const estimate = await salaryEstimationService.estimateSalary(query);
  return ok(res, { estimate });
});

/** GET /api/analytics/recruitment?company_id=… — employer pipeline analytics. */
export const recruitment = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = recruitmentAnalyticsQuerySchema.parse(req.query);
  const companyId = await resolveCompanyForUser(req.user!, query.company_id);
  const analytics = await companyAnalyticsService.getCompanyAnalytics(companyId);
  return ok(res, { analytics });
});

/** GET /api/analytics/platform — admin, whole-board analytics. */
export const platform = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const analytics = await recruitmentAnalyticsService.getPlatformAnalytics();
  return ok(res, { analytics });
});

/** GET /api/analytics/jobs/:jobId — per-posting performance. */
export const jobAnalytics = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const analytics = await jobAnalyticsService.getJobAnalyticsForUser(req.user!, jobId);
  return ok(res, { analytics });
});

export default {
  salaryEstimate,
  recruitment,
  platform,
  jobAnalytics,
};
