import { ITimestamps } from './commonInterface';

/** A degree/diploma entry on a jobseeker's profile. */
export interface IEducation extends ITimestamps {
  id: string;
  jobseeker_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: Date | null;
  end_date: Date | null;
  is_current: boolean;
  grade: string | null;
  description: string | null;
}

export interface IEducationCreation {
  jobseeker_id: string;
  institution: string;
  degree: string;
  field_of_study?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  is_current?: boolean;
  grade?: string | null;
  description?: string | null;
}

export type IEducationUpdate = Partial<Omit<IEducationCreation, 'jobseeker_id'>>;
