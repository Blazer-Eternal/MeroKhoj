import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { jobAlertServices } from '../../../services';
import { createJobAlertSchema, updateJobAlertSchema } from '../../../validators';
import { parseId } from '../../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/job-alerts */
export const listJobAlerts = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const alerts = await jobAlertServices.listJobAlerts(req.user!);
  return ok(res, { job_alerts: alerts });
});

/** POST /api/job-alerts */
export const createJobAlert = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createJobAlertSchema.parse(req.body);
  const alert = await jobAlertServices.createJobAlert(req.user!, input);
  return ok(res, { job_alert: alert }, 201);
});

/** GET /api/job-alerts/:id */
export const getJobAlert = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const alert = await jobAlertServices.getJobAlert(req.user!, id);
  return ok(res, { job_alert: alert });
});

/** PATCH /api/job-alerts/:id */
export const updateJobAlert = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateJobAlertSchema.parse(req.body);
  const alert = await jobAlertServices.updateJobAlert(req.user!, id, input);
  return ok(res, { job_alert: alert });
});

/** DELETE /api/job-alerts/:id */
export const deleteJobAlert = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await jobAlertServices.deleteJobAlert(req.user!, id);
  return ok(res, { message: 'Job alert deleted' });
});

/** POST /api/job-alerts/:id/test → preview current matches (no notification). */
export const previewMatches = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const alert = await jobAlertServices.getJobAlert(req.user!, id);
  const matches = await jobAlertServices.findMatches(alert);
  return ok(res, { matches });
});

export default {
  listJobAlerts,
  createJobAlert,
  getJobAlert,
  updateJobAlert,
  deleteJobAlert,
  previewMatches,
};
