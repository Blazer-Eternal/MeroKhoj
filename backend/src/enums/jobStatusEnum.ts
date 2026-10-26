/** Publishing lifecycle of a job posting. */
export enum JobStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export const JOB_STATUSES: JobStatus[] = Object.values(JobStatus);

/** Job statuses that are visible to jobseekers in search/browse. */
export const JOB_VISIBLE_STATUSES: JobStatus[] = [JobStatus.PUBLISHED];

/** Job statuses that can still receive new applications. */
export const JOB_ACCEPTING_APPLICATION_STATUSES: JobStatus[] = [JobStatus.PUBLISHED];

/**
 * Allowed job status transitions. Keys are the current status, values are the
 * statuses it may move to. Enforced in jobServices.
 */
export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.PENDING_REVIEW, JobStatus.CANCELLED],
  [JobStatus.PENDING_REVIEW]: [JobStatus.PUBLISHED, JobStatus.CANCELLED],
  [JobStatus.PUBLISHED]: [JobStatus.PAUSED, JobStatus.CLOSED, JobStatus.CANCELLED],
  [JobStatus.PAUSED]: [JobStatus.PUBLISHED, JobStatus.CLOSED, JobStatus.CANCELLED],
  [JobStatus.CLOSED]: [],
  [JobStatus.CANCELLED]: [],
};
