import { ModerationAction } from '../enums';

/** Append-only moderation decision record for a job. */
export interface IJobModeration {
  id: string;
  job_id: string;
  reviewed_by: string;
  action: ModerationAction;
  reason: string | null;
  created_at: Date;
}

export interface IJobModerationCreation {
  job_id: string;
  reviewed_by: string;
  action: ModerationAction;
  reason?: string | null;
}
