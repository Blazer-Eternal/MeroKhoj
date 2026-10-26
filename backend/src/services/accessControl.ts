import { AppError } from '../utils';
import { IAuthUser } from '../interfaces';
import {
  RoleName,
  CompanyRole,
  COMPANY_MANAGEMENT_ROLES,
  COMPANY_JOB_MANAGER_ROLES,
  COMPANY_HIRING_ROLES,
} from '../enums';
import { companyMemberRepository, jobRepository } from '../repositories';

/**
 * Centralized permission rules.
 *
 * Company-scoped authorization is decided by the user's membership role inside
 * that specific company (company_members.role), NOT their global platform role.
 * Platform admins bypass company checks.
 */

export const isPlatformAdmin = (user: IAuthUser): boolean =>
  user.roles.includes(RoleName.ADMIN) || user.roles.includes(RoleName.SUPER_ADMIN);

/** Assert the user is an active member of the company with one of `allowedRoles`. */
export const assertCompanyMember = async (
  user: IAuthUser,
  companyId: string,
  allowedRoles: CompanyRole[] = COMPANY_MANAGEMENT_ROLES,
): Promise<void> => {
  if (isPlatformAdmin(user)) return;

  const allowed = await companyMemberRepository.hasMinimumRole(companyId, user.id, allowedRoles);
  if (!allowed) {
    throw AppError.forbidden('You are not authorized to manage this company');
  }
};

/** Assert the user can create/edit jobs for the company. */
export const assertCanManageJobs = async (
  user: IAuthUser,
  companyId: string,
): Promise<void> => assertCompanyMember(user, companyId, COMPANY_JOB_MANAGER_ROLES);

/** Assert the user can make hiring decisions for the company. */
export const assertCanMakeHiringDecisions = async (
  user: IAuthUser,
  companyId: string,
): Promise<void> => assertCompanyMember(user, companyId, COMPANY_HIRING_ROLES);

/** Assert the user can manage company settings/members. */
export const assertCanManageCompany = async (
  user: IAuthUser,
  companyId: string,
): Promise<void> => assertCompanyMember(user, companyId, COMPANY_MANAGEMENT_ROLES);

/**
 * Assert the user may view/act on a specific application.
 * Allowed: the applicant themselves, or an active member of the job's company.
 */
export const assertCanAccessApplication = async (
  user: IAuthUser,
  application: { id: string; jobseeker_id: string; job?: unknown },
): Promise<void> => {
  // The applicant always owns their application.
  if (application.jobseeker_id === user.id) return;

  if (isPlatformAdmin(user)) return;

  const job = application.job as { company_id?: string } | undefined;
  if (job?.company_id) {
    const isMember = await companyMemberRepository.hasMinimumRole(
      job.company_id,
      user.id,
      Object.values(CompanyRole),
    );
    if (isMember) return;
  }

  throw AppError.forbidden('You are not authorized to view this application');
};

/** Assert the user owns the jobseeker profile for the given user id. */
export const assertOwnsJobseekerProfile = (
  user: IAuthUser,
  ownerUserId: string,
): void => {
  if (user.id !== ownerUserId && !isPlatformAdmin(user)) {
    throw AppError.forbidden('You can only manage your own profile');
  }
};

/**
 * Resolve the company id a user acts on behalf of.
 * For non-admins this requires active membership in that company.
 */
export const resolveCompanyForUser = async (
  user: IAuthUser,
  companyId: string,
): Promise<string> => {
  if (isPlatformAdmin(user)) return companyId;

  const isMember = await companyMemberRepository.hasMinimumRole(
    companyId,
    user.id,
    Object.values(CompanyRole),
  );
  if (!isMember) {
    throw AppError.forbidden('You are not a member of this company');
  }
  return companyId;
};

/** Load a job or throw 404. */
export const loadJobOrThrow = async (jobId: string) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');
  return job;
};

export const accessControl = {
  isPlatformAdmin,
  assertCompanyMember,
  assertCanManageJobs,
  assertCanMakeHiringDecisions,
  assertCanManageCompany,
  assertCanAccessApplication,
  assertOwnsJobseekerProfile,
  resolveCompanyForUser,
};

export default accessControl;
