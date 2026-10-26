import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { interviewServices } from '../../services';
import {
  scheduleInterviewSchema,
  updateInterviewSchema,
  changeInterviewStatusSchema,
} from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/interviews */
export const scheduleInterview = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = scheduleInterviewSchema.parse(req.body);
  const interview = await interviewServices.scheduleInterview(req.user!, input);
  return ok(res, { interview }, 201);
});

/** GET /api/interviews/:id */
export const getInterview = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const interview = await interviewServices.getInterview(req.user!, id);
  return ok(res, { interview });
});

/** PATCH /api/interviews/:id */
export const updateInterview = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateInterviewSchema.parse(req.body);
  const interview = await interviewServices.updateInterview(req.user!, id, input);
  return ok(res, { interview });
});

/** PATCH /api/interviews/:id/status — confirm/complete/cancel/reschedule/no-show. */
export const changeInterviewStatus = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { status } = changeInterviewStatusSchema.parse(req.body);
  const interview = await interviewServices.changeInterviewStatus(req.user!, id, status);
  return ok(res, { interview });
});

/** GET /api/applications/:applicationId/interviews */
export const listForApplication = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const applicationId = parseId(req.params.applicationId);
  const interviews = await interviewServices.listInterviewsForApplication(
    req.user!,
    applicationId,
  );
  return ok(res, { interviews });
});

/** GET /api/companies/:companyId/interviews/upcoming */
export const listUpcoming = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const interviews = await interviewServices.listUpcomingForCompany(req.user!, companyId, limit);
  return ok(res, { interviews });
});

export default {
  scheduleInterview,
  getInterview,
  updateInterview,
  changeInterviewStatus,
  listForApplication,
  listUpcoming,
};
