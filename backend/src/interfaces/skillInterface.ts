import { SkillStatus, JobSkillImportance } from '../enums';
import { ITimestamps } from './commonInterface';

/** A reusable skill in the catalog. */
export interface ISkill extends ITimestamps {
  id: string;
  name: string;
  description: string | null;
  status: SkillStatus;
}

export interface ISkillCreation {
  name: string;
  description?: string | null;
  status?: SkillStatus;
}

/** A skill required/preferred by a job. */
export interface IJobSkill {
  id: string;
  job_id: string;
  skill_id: string;
  importance: JobSkillImportance;
  minimum_experience: number | null;
}

export interface IJobSkillCreation {
  job_id: string;
  skill_id: string;
  importance: JobSkillImportance;
  minimum_experience?: number | null;
}
