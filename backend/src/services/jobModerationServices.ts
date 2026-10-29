import { AppError } from '../utils';
import { IJobModeration, IJobModerationCreation, IAuthUser } from '../interfaces';
import {
  ModerationAction,
  MODERATION_JOB_STATUS,
  MODERATION_ACTIONS_REQUIRING_REASON,
  JobStatus,
} from '../enums';
import { jobModerationRepository, jobRepository } from '../repositories';
import { isPlatformAdmin } from './accessControl';
import { recordAuditForUser } from './auditLogServices';

/**
 * Job moderation service.
 *
 * A moderator/admin reviews a job and takes an action; the job's status is
 * updated in the SAME transaction so the moderation outcome is always
 * consistent with the job lifecycle:
 *
 *   APPROVED → PUBLISHED   REJECTED → CANCELLED
 *   FLAGGED  → PAUSED      REMOVED  → CLOSED
 *
 * Every action is recorded in the append-only `job_moderation` table and an
 * audit log entry is written.
 */

/** Only platform admins and moderators may moderate. */
const assertCanModerate = (user: IAuthUser): void => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only moderators can moderate jobs');
  }
};

export const moderateJob = async (
  user: IAuthUser,
  jobId: string,
  input: { action: ModerationAction; reason?: string | null },
): Promise<{ moderation: IJobModeration; jobStatus: JobStatus }> => {
  assertCanModerate(user);

  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');

  // Rejection/removal must carry a reason.
  if (MODERATION_ACTIONS_REQUIRING_REASON.includes(input.action) && !input.reason) {
    throw AppError.badRequest(`A reason is required for ${input.action}`);
  }

  const targetStatus = MODERATION_JOB_STATUS[input.action] as JobStatus;

  // The job must actually be able to move to the target status.
  if (job.status === targetStatus) {
    throw AppError.conflict(`Job is already ${targetStatus}`);
  }

  const moderation = await jobModerationRepository.create({
    job_id: jobId,
    reviewed_by: user.id,
    action: input.action,
    reason: input.reason ?? null,
  });

  const updates: Record<string, unknown> = { status: targetStatus };
  if (targetStatus === JobStatus.PUBLISHED && !job.published_at) {
    updates.published_at = new Date();
  }
  if (targetStatus === JobStatus.CLOSED) {
    updates.closed_at = new Date();
  }
  await jobRepository.update(jobId, updates);

  await recordAuditForUser(user, {
    action: `JOB_${input.action}`,
    entity_type: 'JOB',
    entity_id: jobId,
    old_values: { status: job.status },
    new_values: { status: targetStatus, reason: input.reason ?? null },
  });

  return { moderation, jobStatus: targetStatus };
};

/** Full moderation history for a job. */
export const listModerationHistory = async (
  user: IAuthUser,
  jobId: string,
): Promise<IJobModeration[]> => {
  assertCanModerate(user);
  return jobModerationRepository.listByJob(jobId);
};

/** Latest moderation decision for a job (null if never moderated). */
export const getLatestModeration = async (
  jobId: string,
): Promise<IJobModeration | null> => jobModerationRepository.findLatestByJob(jobId);

export const jobModerationServices = {
  moderateJob,
  listModerationHistory,
  getLatestModeration,
};

export default jobModerationServices;
