import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { applicationServices } from '../../services';
import {
  applyToJobSchema,
  changeApplicationStatusSchema,
  withdrawApplicationSchema,
  applicationListQuerySchema,
} from '../../validators';
import { parseId } from '../../utils';
import { ApplicationStatus } from '../../enums';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/jobs/:jobId/applications — a candidate applies. */
export const applyToJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const jobId = parseId(req.params.jobId);
  const input = applyToJobSchema.parse(req.body ?? {});
  const application = await applicationServices.applyToJob(req.user!, jobId, input);
  return ok(res, { application }, 201);
});

/** GET /api/applications/mine — a candidate's own applications. */
export const listMyApplications = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = applicationListQuerySchema.parse(req.query);
  const result = await applicationServices.listMyApplications(
    req.user!,
    { status: query.status },
    query,
  );
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** GET /api/applications/:id */
export const getApplication = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const application = await applicationServices.getApplication(req.user!, id);
  return ok(res, { application });
});

/** GET /api/applications/:id/history */
export const getApplicationHistory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const history = await applicationServices.getStatusHistory(req.user!, id);
  return ok(res, { history });
});

/** PATCH /api/applications/:id/status — employer-side transition. */
export const changeStatus = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = changeApplicationStatusSchema.parse(req.body);
  const application = await applicationServices.changeApplicationStatus(req.user!, id, {
    new_status: input.status,
    reason: input.reason,
  });
  return ok(res, { application });
});

/** POST /api/applications/:id/withdraw — candidate withdraws. */
export const withdraw = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { reason } = withdrawApplicationSchema.parse(req.body ?? {});
  const application = await applicationServices.withdrawApplication(req.user!, id, reason);
  return ok(res, { application });
});

/** GET /api/companies/:companyId/applications — recruiter pipeline. */
export const listCompanyApplications = asyncHandler(
  async (req: ICustomRequest, res: Response) => {
    const companyId = parseId(req.params.companyId);
    const query = applicationListQuerySchema.parse(req.query);
    const result = await applicationServices.listCompanyApplications(
      req.user!,
      companyId,
      { job_id: query.job_id, status: query.status as ApplicationStatus | undefined },
      query,
    );
    return res.status(200).json({ success: true, data: result.data, meta: result.meta });
  },
);

export default {
  applyToJob,
  listMyApplications,
  getApplication,
  getApplicationHistory,
  changeStatus,
  withdraw,
  listCompanyApplications,
};
