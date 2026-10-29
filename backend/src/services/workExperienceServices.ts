import { AppError } from '../utils';
import {
  IWorkExperience,
  IWorkExperienceCreation,
  IWorkExperienceUpdate,
  IAuthUser,
} from '../interfaces';
import { workExperienceRepository, jobseekerProfileRepository } from '../repositories';
import { assertOwnsJobseekerProfile } from './accessControl';

/**
 * Work experience business logic.
 *
 * Rules enforced here:
 *   - end_date must be >= start_date.
 *   - is_current = TRUE implies end_date IS NULL (cleared automatically).
 */

const assertAndResolve = async (user: IAuthUser, profileId: string): Promise<string> => {
  const profile = await jobseekerProfileRepository.findById(profileId);
  if (!profile) throw AppError.notFound('Jobseeker profile not found');
  assertOwnsJobseekerProfile(user, profile.user_id);
  return profile.id;
};

const normalizeExperienceInput = (
  input: Partial<IWorkExperienceCreation> & { start_date?: Date | null; end_date?: Date | null },
): void => {
  if (input.start_date && input.end_date) {
    const start = new Date(input.start_date).getTime();
    const end = new Date(input.end_date).getTime();
    if (end < start) {
      throw AppError.badRequest('end_date must be on or after start_date');
    }
  }
};

export const listExperiences = async (
  user: IAuthUser,
  profileId: string,
): Promise<IWorkExperience[]> => {
  const id = await assertAndResolve(user, profileId);
  return workExperienceRepository.listByJobseeker(id);
};

export const createExperience = async (
  user: IAuthUser,
  profileId: string,
  input: Omit<IWorkExperienceCreation, 'jobseeker_id'>,
): Promise<IWorkExperience> => {
  const id = await assertAndResolve(user, profileId);
  normalizeExperienceInput(input);

  const payload: IWorkExperienceCreation = { ...input, jobseeker_id: id };
  if (payload.is_current) payload.end_date = null;

  return workExperienceRepository.create(payload);
};

export const updateExperience = async (
  user: IAuthUser,
  experienceId: string,
  updates: IWorkExperienceUpdate,
): Promise<IWorkExperience> => {
  const existing = await workExperienceRepository.findById(experienceId);
  if (!existing) throw AppError.notFound('Work experience not found');
  await assertAndResolve(user, existing.jobseeker_id);

  const merged = {
    ...updates,
    start_date: updates.start_date !== undefined ? updates.start_date : existing.start_date,
    end_date: updates.end_date !== undefined ? updates.end_date : existing.end_date,
    is_current: updates.is_current !== undefined ? updates.is_current : existing.is_current,
  };
  normalizeExperienceInput(merged);

  const payload: Partial<IWorkExperience> = { ...updates };
  if (merged.is_current) payload.end_date = null;

  const updated = await workExperienceRepository.update(experienceId, payload);
  if (!updated) throw AppError.notFound('Work experience not found');
  return updated;
};

export const deleteExperience = async (
  user: IAuthUser,
  experienceId: string,
): Promise<void> => {
  const existing = await workExperienceRepository.findById(experienceId);
  if (!existing) throw AppError.notFound('Work experience not found');
  await assertAndResolve(user, existing.jobseeker_id);
  await workExperienceRepository.destroy(experienceId);
};

export const workExperienceServices = {
  listExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
};

export default workExperienceServices;
