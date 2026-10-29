import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { resumeServices } from '../../services';
import { createResumeSchema, updateResumeSchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/profiles/:profileId/resumes */
export const listResumes = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profileId = parseId(req.params.profileId, 'profileId');
  const resumes = await resumeServices.listResumes(req.user!, profileId);
  return ok(res, { resumes });
});

/** POST /api/profiles/:profileId/resumes */
export const createResume = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profileId = parseId(req.params.profileId, 'profileId');
  const input = createResumeSchema.parse(req.body);
  const resume = await resumeServices.createResume(req.user!, profileId, input);
  return ok(res, { resume }, 201);
});

/** PATCH /api/resumes/:id */
export const updateResume = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateResumeSchema.parse(req.body);
  const resume = await resumeServices.updateResume(req.user!, id, input);
  return ok(res, { resume });
});

/** PATCH /api/resumes/:id/default */
export const setDefaultResume = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const resume = await resumeServices.setDefaultResume(req.user!, id);
  return ok(res, { resume });
});

/** DELETE /api/resumes/:id */
export const deleteResume = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await resumeServices.deleteResume(req.user!, id);
  return ok(res, { message: 'Resume deleted' });
});

export default { listResumes, createResume, updateResume, setDefaultResume, deleteResume };
