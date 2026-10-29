import { AppError } from '../utils';
import { IResume, IResumeCreation, IResumeUpdate, IAuthUser } from '../interfaces';
import { resumeRepository, jobseekerProfileRepository } from '../repositories';
import { assertOwnsJobseekerProfile } from './accessControl';
import { getSequelize } from '../config';

/**
 * Resume business logic.
 *
 * Rules enforced here:
 *   - File type must be an allowed format (pdf / doc / docx).
 *   - File size must be > 0 and within the configured upload limit.
 *   - Only ONE resume per jobseeker may be default. This is enforced by a
 *     partial unique index AND handled transactionally here: when a resume is
 *     made default we first clear the flag on all others inside a transaction.
 */

/** Permitted resume file extensions and their MIME types. */
export const ALLOWED_RESUME_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const assertValidFile = (fileType: string, fileSize: number): void => {
  const ext = fileType.toLowerCase();
  if (!Object.keys(ALLOWED_RESUME_TYPES).includes(ext)) {
    throw AppError.badRequest(
      `Unsupported resume file type "${ext}". Allowed: ${Object.keys(ALLOWED_RESUME_TYPES).join(', ')}`,
    );
  }
  if (fileSize <= 0) {
    throw AppError.badRequest('file_size_bytes must be greater than 0');
  }
  if (fileSize > MAX_RESUME_SIZE_BYTES) {
    throw AppError.badRequest(
      `Resume exceeds the maximum size of ${MAX_RESUME_SIZE_BYTES / (1024 * 1024)} MB`,
    );
  }
};

const assertAndResolve = async (user: IAuthUser, profileId: string): Promise<string> => {
  const profile = await jobseekerProfileRepository.findById(profileId);
  if (!profile) throw AppError.notFound('Jobseeker profile not found');
  assertOwnsJobseekerProfile(user, profile.user_id);
  return profile.id;
};

export const listResumes = async (user: IAuthUser, profileId: string): Promise<IResume[]> => {
  const id = await assertAndResolve(user, profileId);
  return resumeRepository.listByJobseeker(id);
};

export const createResume = async (
  user: IAuthUser,
  profileId: string,
  input: Omit<IResumeCreation, 'jobseeker_id'>,
): Promise<IResume> => {
  const id = await assertAndResolve(user, profileId);
  assertValidFile(input.file_type, input.file_size_bytes);

  // If this is the first resume, force it to be the default.
  const existingCount = await resumeRepository.countByJobseeker(id);
  const shouldBeDefault = input.is_default || existingCount === 0;

  const sequelize = getSequelize();
  const t = await sequelize.transaction();
  try {
    if (shouldBeDefault) {
      await resumeRepository.clearDefault(id);
    }
    const created = await resumeRepository.create({
      ...input,
      jobseeker_id: id,
      is_default: shouldBeDefault,
    });
    await t.commit();
    return created;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateResume = async (
  user: IAuthUser,
  resumeId: string,
  updates: IResumeUpdate,
): Promise<IResume> => {
  const existing = await resumeRepository.findById(resumeId);
  if (!existing) throw AppError.notFound('Resume not found');
  await assertAndResolve(user, existing.jobseeker_id);

  if (updates.file_type !== undefined || updates.file_size_bytes !== undefined) {
    assertValidFile(
      updates.file_type ?? existing.file_type,
      updates.file_size_bytes ?? existing.file_size_bytes,
    );
  }

  const sequelize = getSequelize();
  const t = await sequelize.transaction();
  try {
    if (updates.is_default === true) {
      await resumeRepository.clearDefault(existing.jobseeker_id);
    }
    const updated = await resumeRepository.update(resumeId, updates);
    if (!updated) throw AppError.notFound('Resume not found');
    await t.commit();
    return updated;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/** Set a resume as the default (clears the flag on all others atomically). */
export const setDefaultResume = async (
  user: IAuthUser,
  resumeId: string,
): Promise<IResume> => {
  const existing = await resumeRepository.findById(resumeId);
  if (!existing) throw AppError.notFound('Resume not found');
  await assertAndResolve(user, existing.jobseeker_id);

  const sequelize = getSequelize();
  const t = await sequelize.transaction();
  try {
    await resumeRepository.clearDefault(existing.jobseeker_id);
    const updated = await resumeRepository.update(resumeId, { is_default: true });
    if (!updated) throw AppError.notFound('Resume not found');
    await t.commit();
    return updated;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const deleteResume = async (user: IAuthUser, resumeId: string): Promise<void> => {
  const existing = await resumeRepository.findById(resumeId);
  if (!existing) throw AppError.notFound('Resume not found');
  await assertAndResolve(user, existing.jobseeker_id);

  const sequelize = getSequelize();
  const t = await sequelize.transaction();
  try {
    await resumeRepository.destroy(resumeId);
    // If we deleted the default, promote the most recent remaining resume.
    if (existing.is_default) {
      const remaining = await resumeRepository.listByJobseeker(existing.jobseeker_id);
      if (remaining.length > 0) {
        await resumeRepository.update(remaining[0].id, { is_default: true });
      }
    }
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const resumeServices = {
  listResumes,
  createResume,
  updateResume,
  setDefaultResume,
  deleteResume,
  ALLOWED_RESUME_TYPES,
};

export default resumeServices;
