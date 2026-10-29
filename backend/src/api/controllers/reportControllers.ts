import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { reportServices } from '../../services';
import {
  createReportSchema,
  updateReportStatusSchema,
  reportQuerySchema,
} from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/reports */
export const createReport = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createReportSchema.parse(req.body);
  const report = await reportServices.createReport(req.user!, input);
  return ok(res, { report }, 201);
});

/** GET /api/reports (admin/moderator) */
export const listReports = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = reportQuerySchema.parse(req.query);
  const reports = await reportServices.listReports(req.user!, query.status);
  return ok(res, { reports });
});

/** GET /api/reports/:id (admin or original reporter) */
export const getReport = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const report = await reportServices.getReport(req.user!, id);
  return ok(res, { report });
});

/** PATCH /api/reports/:id/status (admin/moderator) */
export const updateReportStatus = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateReportStatusSchema.parse(req.body);
  const report = await reportServices.changeReportStatus(
    req.user!,
    id,
    input.status,
    input.reason,
  );
  return ok(res, { report });
});

export default { createReport, listReports, getReport, updateReportStatus };
