import { AppError } from '../utils';
import { IEducation, IEducationCreation, IEducationUpdate, IAuthUser } from '../interfaces';
import { educationRepository, jobseekerProfileRepository } from '../repositories';
import { assertOwnsJobseekerProfile } from './accessControl';

/**
 * Education business logic.
 *
 * Rules enforced here:
 *   - end_date must be >= start_date.
 *   - is_current = TRUE implies end_date IS NULL (we clear it automatically).
 *   - Entries are owned via the jobseeker profile, which is resolved from the
 *     authenticated user (or an explicitly-targeted profile for admins).
 */

/** Resolve the jobseeker profile id for a user, throwing if absent. */
const resolveProfileId = async (userId: string): Promise<string> => {
  const profile = await jobseekerProfileRepository.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Jobseeker profile not found. Create a profile first.');
  }
  return profile.id;
};

/** Assert the caller owns (or may act on) the profile and return its id. */
const assertAndResolve = async (user: IAuthUser, profileId: string): Promise<string> => {
  const profile = await jobseekerProfileRepository.findById(profileId);
  if (!profile) throw AppError.notFound('Jobseeker profile not found');
  assertOwnsJobseekerProfile(user, profile.user_id);
  return profile.id;
};

/** Validate the date relationship and normalize is_current. */
const normalizeEducationInput = (
  input: Partial<IEducationCreation> & { start_date?: Date | null; end_date?: Date | null },
): void => {
  if (input.start_date && input.end_date) {
    const start = new Date(input.start_date).getTime();
    const end = new Date(input.end_date).getTime();
    if (end < start) {
      throw AppError.badRequest('end_date must be on or after start_date');
    }
  }
};

export const listEducations = async (user: IAuthUser, profileId: string): Promise<IEducation[]> => {
  const id = await assertAndResolve(user, profileId);
  return educationRepository.listByJobseeker(id);
};

export const createEducation = async (
  user: IAuthUser,
  profileId: string,
  input: Omit<IEducationCreation, 'jobseeker_id'>,
): Promise<IEducation> => {
  const id = await assertAndResolve(user, profileId);
  normalizeEducationInput(input);

  const payload: IEducationCreation = { ...input, jobseeker_id: id };
  // A current education entry has no end date.
  if (payload.is_current) payload.end_date = null;

  return educationRepository.create(payload);
};

export const updateEducation = async (
  user: IAuthUser,
  educationId: string,
  updates: IEducationUpdate,
): Promise<IEducation> => {
  const existing = await educationRepository.findById(educationId);
  if (!existing) throw AppError.notFound('Education entry not found');
  await assertAndResolve(user, existing.jobseeker_id);

  const merged = {
    ...updates,
    start_date: updates.start_date !== undefined ? updates.start_date : existing.start_date,
    end_date: updates.end_date !== undefined ? updates.end_date : existing.end_date,
    is_current: updates.is_current !== undefined ? updates.is_current : existing.is_current,
  };
  normalizeEducationInput(merged);

  const payload: Partial<IEducation> = { ...updates };
  if (merged.is_current) payload.end_date = null;

  const updated = await educationRepository.update(educationId, payload);
  if (!updated) throw AppError.notFound('Education entry not found');
  return updated;
};

export const deleteEducation = async (user: IAuthUser, educationId: string): Promise<void> => {
  const existing = await educationRepository.findById(educationId);
  if (!existing) throw AppError.notFound('Education entry not found');
  await assertAndResolve(user, existing.jobseeker_id);
  await educationRepository.destroy(educationId);
};

export const educationServices = {
  listEducations,
  createEducation,
  updateEducation,
  deleteEducation,
  resolveProfileId,
};

export default educationServices;
