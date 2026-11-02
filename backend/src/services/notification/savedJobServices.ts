import { AppError } from '../../utils';
import { ISavedJob, IAuthUser } from '../../interfaces';
import { JobStatus, JOB_VISIBLE_STATUSES } from '../../enums';
import { savedJobRepository, jobRepository, jobseekerProfileRepository } from '../../repositories';
import { recordAuditForUser } from '../administration/auditLogServices';

/**
 * Saved jobs (bookmarks) business logic.
 *
 * Rules enforced here:
 *   - Only PUBLISHED jobs can be saved.
 *   - A job can only be saved once per user (unique constraint); duplicate
 *     saves are surfaced as a 409 conflict.
 *   - Only jobseekers (users with a jobseeker profile) can save jobs.
 */

/** Ensure the user has a jobseeker profile (i.e. is a jobseeker). */
const assertIsJobseeker = async (userId: string): Promise<void> => {
  const profile = await jobseekerProfileRepository.findByUserId(userId);
  if (!profile) {
    throw AppError.forbidden('Only jobseekers can save jobs');
  }
};

export const saveJob = async (user: IAuthUser, jobId: string): Promise<ISavedJob> => {
  await assertIsJobseeker(user.id);

  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');
  if (!JOB_VISIBLE_STATUSES.includes(job.status as JobStatus)) {
    throw AppError.badRequest('Only published jobs can be saved');
  }

  if (await savedJobRepository.exists(user.id, jobId)) {
    throw AppError.conflict('You have already saved this job');
  }

  const saved = await savedJobRepository.create({ user_id: user.id, job_id: jobId });

  await recordAuditForUser(user, {
    action: 'JOB_SAVED',
    entity_type: 'JOB',
    entity_id: jobId,
    new_values: { saved_job_id: saved.id },
  });

  return saved;
};

export const unsaveJob = async (user: IAuthUser, jobId: string): Promise<void> => {
  const existing = await savedJobRepository.findByUserAndJob(user.id, jobId);
  if (!existing) throw AppError.notFound('Saved job not found');

  await savedJobRepository.destroy(existing.id);

  await recordAuditForUser(user, {
    action: 'JOB_UNSAVED',
    entity_type: 'JOB',
    entity_id: jobId,
    old_values: { saved_job_id: existing.id },
  });
};

/** List every job the user has saved, newest first. */
export const listSavedJobs = async (user: IAuthUser): Promise<ISavedJob[]> =>
  savedJobRepository.listByUser(user.id);

/** Is this specific job saved by the user? */
export const isJobSaved = async (user: IAuthUser, jobId: string): Promise<boolean> =>
  savedJobRepository.exists(user.id, jobId);

/** For a list of job ids, return the subset that the user has saved. */
export const getSavedJobIds = async (
  userId: string,
  jobIds: string[],
): Promise<string[]> => {
  const saved = await savedJobRepository.findExistingPairs(userId, jobIds);
  return [...saved];
};

export const savedJobServices = {
  saveJob,
  unsaveJob,
  listSavedJobs,
  isJobSaved,
  getSavedJobIds,
  assertIsJobseeker,
};

export default savedJobServices;
