import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import { userServices, jobseekerProfileServices } from '../../../services';
import {
  updateProfileSchema,
  updateJobseekerProfileSchema,
  listUsersQuerySchema,
  setUserStatusSchema,
} from '../../../validators';
import { parseId } from '../../../utils';

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
  const [profile, skills] = await Promise.all([
    jobseekerProfileServices.ensureProfile(req.user!.id),
    jobseekerProfileServices.getProfileSkills(req.user!.id),
  ]);
  return ok(res, { profile: { ...profile, skills } });
});

/** PUT /api/users/me/profile */
export const upsertMyJobseekerProfile = asyncHandler(
  async (req: ICustomRequest, res: Response) => {
    const { skill_ids, ...updates } = updateJobseekerProfileSchema.parse(req.body);
    const profile = await jobseekerProfileServices.updateOwnProfile(req.user!, updates);
    if (skill_ids !== undefined) {
      await jobseekerProfileServices.setProfileSkills(req.user!.id, skill_ids);
    }
    const skills = await jobseekerProfileServices.getProfileSkills(req.user!.id);
    return ok(res, { profile: { ...profile, skills } });
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

/** GET /api/admin/users — paginated account directory (admin only). */
export const listAdminUsers = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await userServices.listUsers(req.user!, query);
  return res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

/** PATCH /api/admin/users/:id/status — suspend or reactivate an account. */
export const setAdminUserStatus = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = setUserStatusSchema.parse(req.body);
  const user = await userServices.setUserStatus(req.user!, id, input.status);
  return ok(res, { user });
});

export default {
  getMe,
  updateMe,
  getMyJobseekerProfile,
  upsertMyJobseekerProfile,
  changePassword,
  listAdminUsers,
  setAdminUserStatus,
};
