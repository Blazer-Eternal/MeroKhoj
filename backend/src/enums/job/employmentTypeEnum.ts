/** Type of engagement for a job. */
export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
  FREELANCE = 'FREELANCE',
}

export const EMPLOYMENT_TYPES: EmploymentType[] = Object.values(EmploymentType);
