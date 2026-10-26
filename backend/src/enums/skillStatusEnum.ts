/** Visibility of a reusable skill in the skills catalog. */
export enum SkillStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const SKILL_STATUSES: SkillStatus[] = Object.values(SkillStatus);
