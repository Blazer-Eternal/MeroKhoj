/** Seniority band expected for a job. */
export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  EXECUTIVE = 'EXECUTIVE',
}

export const EXPERIENCE_LEVELS: ExperienceLevel[] = Object.values(ExperienceLevel);

/** Rough years range associated with each level (used for search/filter defaults). */
export const EXPERIENCE_LEVEL_YEARS: Record<ExperienceLevel, { min: number; max: number }> = {
  [ExperienceLevel.ENTRY]: { min: 0, max: 2 },
  [ExperienceLevel.MID]: { min: 2, max: 5 },
  [ExperienceLevel.SENIOR]: { min: 5, max: 10 },
  [ExperienceLevel.LEAD]: { min: 8, max: 15 },
  [ExperienceLevel.EXECUTIVE]: { min: 12, max: 40 },
};
