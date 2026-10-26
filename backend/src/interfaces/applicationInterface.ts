import { ApplicationStatus, ApplicationSource } from '../enums';
import { ITimestamps } from './commonInterface';

/** A candidate's application to a job. */
export interface IApplication extends ITimestamps {
  id: string;
  job_id: string;
  jobseeker_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  applied_at: Date;
  withdrawn_at: Date | null;
}

export interface IApplicationCreation {
  job_id: string;
  jobseeker_id: string;
  resume_url?: string | null;
  cover_letter?: string | null;
  status?: ApplicationStatus;
  source?: ApplicationSource;
  applied_at?: Date;
  withdrawn_at?: Date | null;
}

/** A single status transition recorded in history. */
export interface IApplicationStatusHistory extends ITimestamps {
  id: string;
  application_id: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by: string;
  reason: string | null;
}

export interface IApplicationStatusHistoryCreation {
  application_id: string;
  old_status?: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by: string;
  reason?: string | null;
}

/** Payload describing a requested status change. */
export interface IStatusChangeInput {
  new_status: ApplicationStatus;
  reason?: string | null;
}
