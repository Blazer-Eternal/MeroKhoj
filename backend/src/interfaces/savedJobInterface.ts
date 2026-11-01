import { ITimestamps } from './commonInterface';

/**
 * A job saved/bookmarked by a jobseeker.
 * Constraint: UNIQUE (user_id, job_id) — a job can only be saved once per user.
 */
export interface ISavedJob extends ITimestamps {
  id: string;
  user_id: string;
  job_id: string;
}

export interface ISavedJobCreation {
  user_id: string;
  job_id: string;
}
