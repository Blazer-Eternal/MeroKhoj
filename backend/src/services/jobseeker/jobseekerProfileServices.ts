import { AppError } from '../../utils';
import { IJobseekerProfile, IJobseekerProfileUpdate } from '../../interfaces';
import { jobseekerProfileRepository, jobseekerProfileSkillRepository } from '../../repositories';
import type { IProfileSkill } from '../../repositories/jobseeker/jobseekerProfileSkillRepository';
import { assertOwnsJobseekerProfile } from '../shared/accessControl';
import { IAuthUser } from '../../interfaces';

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

/** Skills listed on the caller's profile (`{ id, name }[]`). */
export const getProfileSkills = async (userId: string): Promise<IProfileSkill[]> =>
  jobseekerProfileSkillRepository.listByUserId(userId);

/** Replace the caller's skills after validating every id exists in the catalog. */
export const setProfileSkills = async (userId: string, skillIds: string[]): Promise<void> => {
  const unique = [...new Set(skillIds)];
  const missing = await jobseekerProfileSkillRepository.missingSkillIds(unique);
  if (missing.length > 0) {
    throw AppError.unprocessable(`Unknown skill id(s): ${missing.join(', ')}`);
  }
  await jobseekerProfileSkillRepository.replaceByUserId(userId, unique);
};

export const jobseekerProfileServices = {
  getProfileByUserId,
  ensureProfile,
  updateOwnProfile,
  getPublicProfile,
  getProfileSkills,
  setProfileSkills,
};

export default jobseekerProfileServices;
