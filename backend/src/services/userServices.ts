import { AppError, getPaginationParams, IPaginationQuery } from '../utils';
import { IUser, IUserPublic, IJobseekerProfile } from '../interfaces';
import { UserStatus, RoleName } from '../enums';
import { userRepository, jobseekerProfileRepository } from '../repositories';
import { isPlatformAdmin } from './accessControl';
import { IAuthUser } from '../interfaces';

/**
 * User account business logic (self-service + admin operations).
 * Profile-specific logic lives in jobseekerProfileServices.
 */
export const getProfile = async (userId: string): Promise<IUserPublic> => {
  const user = await userRepository.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return userRepository.toPublic(user);
};

export const getProfileWithRoles = async (
  userId: string,
): Promise<{ user: IUserPublic; roles: RoleName[] }> => {
  const user = await userRepository.findByIdWithRoles(userId);
  if (!user) throw AppError.notFound('User not found');
  const { roles, ...rest } = user;
  return { user: userRepository.toPublic(rest as IUser), roles };
};

/** Update basic account fields (name, phone). */
export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<IUser, 'first_name' | 'last_name' | 'phone'>>,
): Promise<IUserPublic> => {
  if (updates.phone && (await userRepository.phoneExists(updates.phone))) {
    throw AppError.conflict('That phone number is already in use');
  }
  const user = await userRepository.update(userId, updates);
  if (!user) throw AppError.notFound('User not found');
  return userRepository.toPublic(user);
};

/** Change password (verifies the current one first). */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await userRepository.findByEmailWithPassword(
    (await userRepository.findById(userId))!.email,
  );
  if (!user) throw AppError.notFound('User not found');

  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw AppError.unauthorized('Current password is incorrect');

  const { env } = await import('../config');
  const hash = await bcrypt.hash(newPassword, env.security.bcryptSaltRounds);
  await userRepository.update(userId, { password_hash: hash });
};

// ---- Admin operations -------------------------------------------------

/** Admin: list all accounts (paginated). */
export const listUsers = async (
  actor: IAuthUser,
  query: IPaginationQuery & { status?: UserStatus },
) => {
  if (!isPlatformAdmin(actor)) throw AppError.forbidden('Admin access required');
  const pagination = getPaginationParams(query);
  // Placeholder for a full admin listing; returns a simple slice for now.
  void pagination;
  void query;
  return { data: [] as IUserPublic[], meta: { total: 0, page: 1, perPage: pagination.perPage, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
};

/** Admin: change an account's status (suspend/reactivate). */
export const setUserStatus = async (
  actor: IAuthUser,
  userId: string,
  status: UserStatus,
): Promise<IUserPublic> => {
  if (!isPlatformAdmin(actor)) throw AppError.forbidden('Admin access required');
  const user = await userRepository.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  await userRepository.setStatus(userId, status);
  return userRepository.toPublic({ ...user, status });
};

/** Load a jobseeker's profile (helper used by talent/employer features). */
export const getJobseekerProfile = async (userId: string): Promise<IJobseekerProfile | null> =>
  jobseekerProfileRepository.findByUserId(userId);

export const userServices = {
  getProfile,
  getProfileWithRoles,
  updateProfile,
  changePassword,
  listUsers,
  setUserStatus,
  getJobseekerProfile,
};

export default userServices;
