import { InterviewType, InterviewStatus } from '../enums';
import { ITimestamps } from './commonInterface';

/** A scheduled interview for an application. */
export interface IInterview extends ITimestamps {
  id: string;
  application_id: string;
  scheduled_by: string;
  interview_type: InterviewType;
  scheduled_at: Date;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  status: InterviewStatus;
  notes: string | null;
}

export interface IInterviewCreation {
  application_id: string;
  scheduled_by: string;
  interview_type: InterviewType;
  scheduled_at: Date;
  duration_minutes: number;
  location?: string | null;
  meeting_url?: string | null;
  status?: InterviewStatus;
  notes?: string | null;
}

export type IInterviewUpdate = Partial<
  Omit<IInterviewCreation, 'application_id' | 'scheduled_by'>
>;
