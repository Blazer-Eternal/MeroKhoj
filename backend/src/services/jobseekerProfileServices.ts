import { AppError } from '../utils';
import { IJobseekerProfile, IJobseekerProfileUpdate } from '../interfaces';
import { jobseekerProfileRepository } from '../repositories';
import { assertOwnsJobseekerProfile } from './accessControl';
import { IAuthUser } from '../interfaces';

/**
 * Jobseeker profile business logic.
 *
 * A profile is 1:1 with a user and is created lazily on first update.
 */
export const getProfileByUserId = async (userId: string): Promise<IJobseekerProfile | null> =>
  jobseekerProfileRepository.findByUserId(userId);

/** Get or create a profile (ensures one exists after registration). */
export const ensureProfile = async (userId: string): Promise<IJobseekerProfile> => {
  const existing = await jobseekerProfileRepository.findByUserId(userId);
  if (existing) return existing;
  return jobseekerProfileRepository.upsertByUserId({ user_id: userId });
};

/** Update the caller's own profile (creates it if missing). */
export const updateOwnProfile = async (
  user: IAuthUser,
  updates: IJobseekerProfileUpdate,
): Promise<IJobseekerProfile> => {
  assertOwnsJobseekerProfile(user, user.id);

  const existing = await jobseekerProfileRepository.findByUserId(user.id);
  if (!existing) {
    return jobseekerProfileRepository.upsertByUserId({ user_id: user.id, ...updates });
  }
  const updated = await jobseekerProfileRepository.updateByUserId(user.id, updates);
  if (!updated) throw AppError.notFound('Profile not found');
  return updated;
};

/** An employer views a candidate's profile (respects visibility). */
export const getPublicProfile = async (
  viewer: IAuthUser,
  ownerUserId: string,
): Promise<IJobseekerProfile> => {
  const profile = await jobseekerProfileRepository.findByUserId(ownerUserId);
  if (!profile) throw AppError.notFound('Profile not found');

  const isOwner = viewer.id === ownerUserId;
  if (profile.profile_visibility === 'PRIVATE' && !isOwner) {
    throw AppError.forbidden('This profile is private');
  }
  return profile;
};

export const jobseekerProfileServices = { getProfileByUserId, ensureProfile, updateOwnProfile, getPublicProfile };

export default jobseekerProfileServices;
