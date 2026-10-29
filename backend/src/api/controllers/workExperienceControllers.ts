import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { workExperienceServices } from '../../services';
import { createExperienceSchema, updateExperienceSchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/profiles/:profileId/work-experiences */
export const listExperiences = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profileId = parseId(req.params.profileId, 'profileId');
  const experiences = await workExperienceServices.listExperiences(req.user!, profileId);
  return ok(res, { experiences });
});

/** POST /api/profiles/:profileId/work-experiences */
export const createExperience = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profileId = parseId(req.params.profileId, 'profileId');
  const input = createExperienceSchema.parse(req.body);
  const experience = await workExperienceServices.createExperience(req.user!, profileId, input);
  return ok(res, { experience }, 201);
});

/** PATCH /api/work-experiences/:id */
export const updateExperience = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateExperienceSchema.parse(req.body);
  const experience = await workExperienceServices.updateExperience(req.user!, id, input);
  return ok(res, { experience });
});

/** DELETE /api/work-experiences/:id */
export const deleteExperience = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await workExperienceServices.deleteExperience(req.user!, id);
  return ok(res, { message: 'Work experience deleted' });
});

export default { listExperiences, createExperience, updateExperience, deleteExperience };
