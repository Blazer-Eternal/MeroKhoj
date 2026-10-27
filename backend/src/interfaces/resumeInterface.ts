import { ITimestamps } from './commonInterface';

/**
 * Metadata for an uploaded resume file. The file itself lives in secure
 * storage; only its reference is kept here.
 */
export interface IResume extends ITimestamps {
  id: string;
  jobseeker_id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  is_default: boolean;
}

export interface IResumeCreation {
  jobseeker_id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  is_default?: boolean;
}

export type IResumeUpdate = Partial<Omit<IResumeCreation, 'jobseeker_id'>>;
