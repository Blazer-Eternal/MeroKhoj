import { EmploymentType, ExperienceLevel, JobStatus } from '../enums';
import { ITimestamps } from './commonInterface';

/** A job posting created by a company. */
export interface IJob extends ITimestamps {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  slug: string;
  description: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  vacancies: number;
  education_requirement: string | null;
  experience_requirement: string | null;
  location: string | null;
  application_deadline: Date | null;
  status: JobStatus;
  published_at: Date | null;
  closed_at: Date | null;
}

export interface IJobCreation {
  company_id: string;
  created_by: string;
  title: string;
  slug: string;
  description: string;
  employment_type: EmploymentType;
  experience_level?: ExperienceLevel | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  vacancies: number;
  education_requirement?: string | null;
  experience_requirement?: string | null;
  location?: string | null;
  application_deadline?: Date | null;
  status?: JobStatus;
  published_at?: Date | null;
  closed_at?: Date | null;
}

export type IJobUpdate = Partial<Omit<IJobCreation, 'company_id' | 'created_by' | 'slug'>>;

/** Filters accepted when searching / listing jobs. */
export interface IJobSearchQuery {
  q?: string;
  company_id?: string;
  employment_type?: EmploymentType;
  experience_level?: ExperienceLevel;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  category?: string;
  status?: JobStatus;
}
