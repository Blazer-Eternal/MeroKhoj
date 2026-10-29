import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { educationServices } from '../../services';
import { createEducationSchema, updateEducationSchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/profiles/:profileId/educations */
export const listEducations = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profileId = parseId(req.params.profileId, 'profileId');
  const educations = await educationServices.listEducations(req.user!, profileId);
  return ok(res, { educations });
});

/** POST /api/profiles/:profileId/educations */
export const createEducation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profileId = parseId(req.params.profileId, 'profileId');
  const input = createEducationSchema.parse(req.body);
  const education = await educationServices.createEducation(req.user!, profileId, input);
  return ok(res, { education }, 201);
});

/** PATCH /api/educations/:id */
export const updateEducation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateEducationSchema.parse(req.body);
  const education = await educationServices.updateEducation(req.user!, id, input);
  return ok(res, { education });
});

/** DELETE /api/educations/:id */
export const deleteEducation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await educationServices.deleteEducation(req.user!, id);
  return ok(res, { message: 'Education entry deleted' });
});

export default { listEducations, createEducation, updateEducation, deleteEducation };
