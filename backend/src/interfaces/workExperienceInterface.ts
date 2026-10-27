import { EmploymentType } from '../enums';
import { ITimestamps } from './commonInterface';

/** A work experience entry on a jobseeker's profile. */
export interface IWorkExperience extends ITimestamps {
  id: string;
  jobseeker_id: string;
  company_name: string;
  job_title: string;
  employment_type: EmploymentType;
  location: string | null;
  start_date: Date;
  end_date: Date | null;
  is_current: boolean;
  description: string | null;
}

export interface IWorkExperienceCreation {
  jobseeker_id: string;
  company_name: string;
  job_title: string;
  employment_type: EmploymentType;
  location?: string | null;
  start_date: Date;
  end_date?: Date | null;
  is_current?: boolean;
  description?: string | null;
}

export type IWorkExperienceUpdate = Partial<Omit<IWorkExperienceCreation, 'jobseeker_id'>>;
