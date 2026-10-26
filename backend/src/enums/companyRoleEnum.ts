/** A user's role *within* a specific company (company_members.role). */
export enum CompanyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  VIEWER = 'VIEWER',
}

export const COMPANY_ROLES: CompanyRole[] = Object.values(CompanyRole);

/** Members that can manage company settings and members. */
export const COMPANY_MANAGEMENT_ROLES: CompanyRole[] = [
  CompanyRole.OWNER,
  CompanyRole.ADMIN,
];

/** Members that can post and manage jobs. */
export const COMPANY_JOB_MANAGER_ROLES: CompanyRole[] = [
  CompanyRole.OWNER,
  CompanyRole.ADMIN,
  CompanyRole.RECRUITER,
];

/** Members that can make hiring decisions. */
export const COMPANY_HIRING_ROLES: CompanyRole[] = [
  CompanyRole.OWNER,
  CompanyRole.ADMIN,
  CompanyRole.HIRING_MANAGER,
];

/**
 * Rank used to prevent a member from assigning a role higher than their own.
 * Higher number = more powerful.
 */
export const COMPANY_ROLE_RANK: Record<CompanyRole, number> = {
  [CompanyRole.VIEWER]: 1,
  [CompanyRole.RECRUITER]: 2,
  [CompanyRole.HIRING_MANAGER]: 3,
  [CompanyRole.ADMIN]: 4,
  [CompanyRole.OWNER]: 5,
};
