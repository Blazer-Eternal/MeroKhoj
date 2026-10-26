import { AppError, getPaginationParams, IPaginationQuery } from '../utils';
import { IApplication, IApplicationCreation, IStatusChangeInput } from '../interfaces';
import {
  ApplicationStatus,
  ApplicationSource,
  APPLICATION_STATUS_TRANSITIONS,
  APPLICATION_CANDIDATE_TRANSITIONS,
  APPLICATION_TERMINAL_STATUSES,
} from '../enums';
import {
  applicationRepository,
  applicationStatusHistoryRepository,
  jobRepository,
} from '../repositories';
import { assertCanAccessApplication, assertCanManageJobs, isPlatformAdmin } from './accessControl';
import { isJobAcceptingApplications } from './jobServices';
import { IAuthUser } from '../interfaces';

/**
 * Application business logic — the heart of the recruitment workflow.
 *
 * Every status change:
 *   1. Validates the transition against APPLICATION_STATUS_TRANSITIONS.
 *   2. Updates the current status.
 *   3. Writes an append-only history row.
 *   4. Records who performed it (changed_by).
 *   5. (Notifications/analytics hooks plug in here.)
 *
 * Withdrawal is reserved for the candidate; all other transitions belong to the
 * employer side.
 */

/** Submit a new application. Enforces one-per-candidate-per-job. */
export const applyToJob = async (
  user: IAuthUser,
  jobId: string,
  input: { resume_url?: string; cover_letter?: string; source?: ApplicationSource },
): Promise<IApplication> => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');

  if (!isJobAcceptingApplications(job)) {
    throw AppError.conflict('This job is not accepting applications');
  }

  const alreadyApplied = await applicationRepository.exists(jobId, user.id);
  if (alreadyApplied) {
    throw AppError.conflict('You have already applied to this job');
  }

  const application = await applicationRepository.create({
    job_id: jobId,
    jobseeker_id: user.id,
    resume_url: input.resume_url ?? null,
    cover_letter: input.cover_letter ?? null,
    status: ApplicationStatus.APPLIED,
    source: input.source ?? ApplicationSource.DIRECT,
    applied_at: new Date(),
  });

  // Record the initial state in history.
  await applicationStatusHistoryRepository.create({
    application_id: application.id,
    old_status: null,
    new_status: ApplicationStatus.APPLIED,
    changed_by: user.id,
    reason: 'Application submitted',
  });

  return application;
};

/** Change an application's status, enforcing the workflow graph. */
export const changeApplicationStatus = async (
  actor: IAuthUser,
  applicationId: string,
  input: IStatusChangeInput,
): Promise<IApplication> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  // Authorization: employer side of the owning company (or platform admin).
  const job = application.job as { company_id?: string } | undefined;
  if (job?.company_id) {
    await assertCanManageJobs(actor, job.company_id);
  } else if (!isPlatformAdmin(actor)) {
    throw AppError.forbidden('You are not authorized to manage this application');
  }

  return performTransition(actor, application, input.new_status, input.reason ?? null);
};

/** The candidate withdraws their own application. */
export const withdrawApplication = async (
  user: IAuthUser,
  applicationId: string,
  reason?: string,
): Promise<IApplication> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  if (application.jobseeker_id !== user.id) {
    throw AppError.forbidden('You can only withdraw your own application');
  }

  return performTransition(user, application, ApplicationStatus.WITHDRAWN, reason ?? 'Withdrawn by candidate');
};

/** Shared transition engine: validate → update → record history. */
const performTransition = async (
  actor: IAuthUser,
  application: IApplication & { job?: unknown },
  newStatus: ApplicationStatus,
  reason: string | null,
): Promise<IApplication> => {
  const current = application.status;

  if (current === newStatus) {
    throw AppError.conflict(`Application is already ${newStatus}`);
  }

  if (APPLICATION_TERMINAL_STATUSES.includes(current)) {
    throw AppError.conflict(`Application is already ${current} and cannot change`);
  }

  // Determine which transition table applies: candidate vs employer.
  const isCandidate = application.jobseeker_id === actor.id;
  const table = isCandidate
    ? APPLICATION_CANDIDATE_TRANSITIONS
    : APPLICATION_STATUS_TRANSITIONS;

  const allowed = table[current] ?? [];
  if (!allowed.includes(newStatus)) {
    throw AppError.conflict(`Cannot move application from ${current} to ${newStatus}`);
  }

  const updates: Partial<IApplication> = { status: newStatus };
  if (newStatus === ApplicationStatus.WITHDRAWN) {
    updates.withdrawn_at = new Date();
  }

  const updated = await applicationRepository.update(application.id, updates);
  if (!updated) throw AppError.notFound('Application not found');

  await applicationStatusHistoryRepository.create({
    application_id: application.id,
    old_status: current,
    new_status: newStatus,
    changed_by: actor.id,
    reason,
  });

  return updated;
};

/** Fetch a single application (with job + applicant), enforcing access. */
export const getApplication = async (
  user: IAuthUser,
  applicationId: string,
): Promise<IApplication & { job?: unknown; jobseeker?: unknown }> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');
  await assertCanAccessApplication(user, application);
  return application;
};

/** A jobseeker lists their own applications. */
export const listMyApplications = async (
  user: IAuthUser,
  filters: { status?: ApplicationStatus },
  query: IPaginationQuery,
) => {
  const pagination = getPaginationParams(query);
  return applicationRepository.listByJobseeker(user.id, filters.status, pagination);
};

/** A recruiter lists applications to their company's jobs. */
export const listCompanyApplications = async (
  user: IAuthUser,
  companyId: string,
  filters: { job_id?: string; status?: ApplicationStatus },
  query: IPaginationQuery,
) => {
  await assertCanManageJobs(user, companyId);
  const pagination = getPaginationParams(query);
  return applicationRepository.listByCompany(companyId, filters, pagination);
};

/** Full status-transition log for an application. */
export const getStatusHistory = async (
  user: IAuthUser,
  applicationId: string,
) => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');
  await assertCanAccessApplication(user, application);
  return applicationStatusHistoryRepository.listByApplication(applicationId);
};

/** Has this candidate already applied to this job? */
export const hasApplied = async (userId: string, jobId: string): Promise<boolean> =>
  applicationRepository.exists(jobId, userId);

export const applicationServices = {
  applyToJob,
  changeApplicationStatus,
  withdrawApplication,
  getApplication,
  listMyApplications,
  listCompanyApplications,
  getStatusHistory,
  hasApplied,
};

export default applicationServices;

// Re-export for controllers that build creation payloads.
export type { IApplicationCreation };
