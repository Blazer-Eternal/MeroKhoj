/**
 * Platform roles a user can hold (many-to-many via user_roles).
 * A single person may act as both a jobseeker and a recruiter.
 */
export enum RoleName {
  JOBSEEKER = 'JOBSEEKER',
  RECRUITER = 'RECRUITER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_NAMES: RoleName[] = Object.values(RoleName);

/** Roles that belong to the platform administration side. */
export const ADMINISTRATIVE_ROLES: RoleName[] = [
  RoleName.MODERATOR,
  RoleName.ADMIN,
  RoleName.SUPER_ADMIN,
];

/** Roles that belong to the employer side of the marketplace. */
export const EMPLOYER_ROLES: RoleName[] = [
  RoleName.RECRUITER,
  RoleName.COMPANY_ADMIN,
];
