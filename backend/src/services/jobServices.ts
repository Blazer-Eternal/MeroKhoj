import { AppError, slugify, ensureUniqueSlug, getPaginationParams, IPaginationQuery } from '../utils';
import { IJob, IJobCreation, IJobUpdate, IJobSearchQuery, IJobSkillCreation } from '../interfaces';
import { JobStatus, JOB_STATUS_TRANSITIONS, JOB_VISIBLE_STATUSES, CompanyVerificationStatus } from '../enums';
import { jobRepository, companyRepository, jobSkillRepository } from '../repositories';
import { assertCanManageJobs, loadJobOrThrow } from './accessControl';
import { IAuthUser } from '../interfaces';

/**
 * Job business logic, including the job publishing workflow.
 *
 * Workflow (enforced via JOB_STATUS_TRANSITIONS):
 *   DRAFT → PENDING_REVIEW → PUBLISHED ⇄ PAUSED → CLOSED
 * Only verified companies may publish. published_at is stamped on first publish.
 */
export const createJob = async (
  user: IAuthUser,
  input: Omit<IJobCreation, 'slug' | 'company_id' | 'created_by'> & { company_id: string },
): Promise<IJob> => {
  await assertCanManageJobs(user, input.company_id);

  const baseSlug = slugify(input.title);
  const slug = await ensureUniqueSlug(baseSlug, (candidate) => jobRepository.slugExists(candidate));

  const job = await jobRepository.create({
    ...input,
    slug,
    created_by: user.id,
    status: JobStatus.DRAFT,
  });

  return job;
};

/** Update a draft/paused job. Critical fields are locked once published. */
export const updateJob = async (
  user: IAuthUser,
  jobId: string,
  updates: IJobUpdate,
): Promise<IJob> => {
  const job = await loadJobOrThrow(jobId);
  await assertCanManageJobs(user, job.company_id);

  if (job.status === JobStatus.CLOSED || job.status === JobStatus.CANCELLED) {
    throw AppError.conflict('A closed or cancelled job can no longer be edited');
  }

  // Once a job is live, structural fields are locked to avoid bait-and-switch.
  if (job.status === JobStatus.PUBLISHED) {
    const locked = ['title', 'company_id'] as const;
    for (const field of locked) {
      if (field in updates && (updates as Record<string, unknown>)[field] !== undefined) {
        throw AppError.conflict(`Cannot change ${field} on a published job`);
      }
    }
  }

  const updated = await jobRepository.update(jobId, updates);
  if (!updated) throw AppError.notFound('Job not found');
  return updated;
};

/**
 * Transition a job to a new status, enforcing the workflow graph.
 * PUBLISHING additionally requires the company to be VERIFIED.
 */
export const changeJobStatus = async (
  user: IAuthUser,
  jobId: string,
  newStatus: JobStatus,
): Promise<IJob> => {
  const job = await loadJobOrThrow(jobId);
  await assertCanManageJobs(user, job.company_id);

  const allowed = JOB_STATUS_TRANSITIONS[job.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw AppError.conflict(`Cannot move job from ${job.status} to ${newStatus}`);
  }

  if (newStatus === JobStatus.PUBLISHED) {
    const company = await companyRepository.findById(job.company_id);
    if (!company || company.verification_status !== CompanyVerificationStatus.VERIFIED) {
      throw AppError.forbidden('Only verified companies can publish jobs');
    }
  }

  const now = new Date();
  const updates: Partial<IJob> = { status: newStatus };

  // Stamp published_at the first time the job goes live.
  if (newStatus === JobStatus.PUBLISHED && !job.published_at) {
    updates.published_at = now;
  }
  if (newStatus === JobStatus.CLOSED) {
    updates.closed_at = now;
  }

  const updated = await jobRepository.update(jobId, updates);
  if (!updated) throw AppError.notFound('Job not found');
  return updated;
};

export const getJobById = async (id: string): Promise<IJob> => loadJobOrThrow(id);

export const getJobBySlug = async (slug: string): Promise<IJob> => {
  const job = await jobRepository.findBySlug(slug);
  if (!job) throw AppError.notFound('Job not found');
  return job;
};

/** Public search across published jobs. */
export const searchJobs = async (
  query: IJobSearchQuery & IPaginationQuery,
) => {
  const pagination = getPaginationParams(query);
  return jobRepository.search(query, pagination);
};

/** A company lists its own jobs (any status). */
export const listCompanyJobs = async (
  user: IAuthUser,
  companyId: string,
  status: JobStatus | undefined,
  query: IPaginationQuery,
) => {
  await assertCanManageJobs(user, companyId);
  const pagination = getPaginationParams(query);
  return jobRepository.listByCompany(companyId, status, pagination);
};

/** Attach/replace the required skills for a job. */
export const setJobSkills = async (
  user: IAuthUser,
  jobId: string,
  skills: Array<Omit<IJobSkillCreation, 'job_id'>>,
): Promise<void> => {
  const job = await loadJobOrThrow(jobId);
  await assertCanManageJobs(user, job.company_id);
  await jobSkillRepository.replaceForJob(jobId, skills);
};

/** Delete a job — only allowed while it is still a draft. */
export const deleteJob = async (user: IAuthUser, jobId: string): Promise<void> => {
  const job = await loadJobOrThrow(jobId);
  await assertCanManageJobs(user, job.company_id);

  if (job.status !== JobStatus.DRAFT) {
    throw AppError.conflict('Only draft jobs can be deleted; close published jobs instead');
  }
  await jobRepository.destroy(jobId);
};

/** Is the job currently open to receive new applications? */
export const isJobAcceptingApplications = (job: IJob): boolean => {
  if (!JOB_VISIBLE_STATUSES.includes(job.status)) return false;
  if (job.application_deadline && job.application_deadline.getTime() < Date.now()) return false;
  return true;
};

export const jobServices = {
  createJob,
  updateJob,
  changeJobStatus,
  getJobById,
  getJobBySlug,
  searchJobs,
  listCompanyJobs,
  setJobSkills,
  deleteJob,
  isJobAcceptingApplications,
};

export default jobServices;
