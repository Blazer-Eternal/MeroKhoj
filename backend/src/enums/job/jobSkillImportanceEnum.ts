/** Whether a skill is mandatory or nice-to-have for a job. */
export enum JobSkillImportance {
  REQUIRED = 'REQUIRED',
  PREFERRED = 'PREFERRED',
}

export const JOB_SKILL_IMPORTANCES: JobSkillImportance[] = Object.values(JobSkillImportance);
