import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { jobServices, skillServices } from '../../services';
import {
  createJobSchema,
  updateJobSchema,
  changeJobStatusSchema,
  setJobSkillsSchema,
  jobSearchQuerySchema,
} from '../../validators';
import { parseId } from '../../utils';
import { JobStatus } from '../../enums';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/jobs */
export const createJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createJobSchema.parse(req.body);
  const job = await jobServices.createJob(req.user!, input);
  return ok(res, { job }, 201);
});

/** GET /api/jobs — public search across published jobs. */
export const searchJobs = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = jobSearchQuerySchema.parse(req.query);
  const result = await jobServices.searchJobs(query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** GET /api/jobs/:id */
export const getJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const job = await jobServices.getJobById(id);
  return ok(res, { job });
});

/** PATCH /api/jobs/:id */
export const updateJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateJobSchema.parse(req.body);
  const job = await jobServices.updateJob(req.user!, id, input);
  return ok(res, { job });
});

/** PATCH /api/jobs/:id/status — DRAFT→REVIEW→PUBLISHED etc. */
export const changeJobStatus = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { status } = changeJobStatusSchema.parse(req.body);
  const job = await jobServices.changeJobStatus(req.user!, id, status);
  return ok(res, { job });
});

/** GET /api/jobs/:id/skills */
export const getJobSkills = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const skills = await skillServices.listSkillsForJob(id);
  return ok(res, { skills });
});

/** PUT /api/jobs/:id/skills */
export const setJobSkills = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { skills } = setJobSkillsSchema.parse(req.body);
  await jobServices.setJobSkills(req.user!, id, skills);
  return ok(res, { message: 'Job skills updated' });
});

/** GET /api/companies/:companyId/jobs — company's own jobs (any status). */
export const listCompanyJobs = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const companyId = parseId(req.params.companyId);
  const status = req.query.status as JobStatus | undefined;
  const result = await jobServices.listCompanyJobs(req.user!, companyId, status, req.query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** DELETE /api/jobs/:id — drafts only. */
export const deleteJob = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await jobServices.deleteJob(req.user!, id);
  return ok(res, { message: 'Job deleted' });
});

export default {
  createJob,
  searchJobs,
  getJob,
  updateJob,
  changeJobStatus,
  getJobSkills,
  setJobSkills,
  listCompanyJobs,
  deleteJob,
};
