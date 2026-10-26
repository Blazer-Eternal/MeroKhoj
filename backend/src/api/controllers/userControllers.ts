import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { userServices, jobseekerProfileServices } from '../../services';
import { updateProfileSchema, updateJobseekerProfileSchema } from '../../validators';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/users/me */
export const getMe = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const result = await userServices.getProfileWithRoles(req.user!.id);
  return ok(res, result);
});

/** PATCH /api/users/me */
export const updateMe = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = updateProfileSchema.parse(req.body);
  const user = await userServices.updateProfile(req.user!.id, input);
  return ok(res, { user });
});

/** GET /api/users/me/profile — the jobseeker professional profile. */
export const getMyJobseekerProfile = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const profile = await jobseekerProfileServices.ensureProfile(req.user!.id);
  return ok(res, { profile });
});

/** PUT /api/users/me/profile */
export const upsertMyJobseekerProfile = asyncHandler(
  async (req: ICustomRequest, res: Response) => {
    const input = updateJobseekerProfileSchema.parse(req.body);
    const profile = await jobseekerProfileServices.updateOwnProfile(req.user!, input);
    return ok(res, { profile });
  },
);

/** PATCH /api/users/me/password */
export const changePassword = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const { current_password, new_password } = req.body as {
    current_password: string;
    new_password: string;
  };
  await userServices.changePassword(req.user!.id, current_password, new_password);
  return ok(res, { message: 'Password updated' });
});

export default {
  getMe,
  updateMe,
  getMyJobseekerProfile,
  upsertMyJobseekerProfile,
  changePassword,
};
