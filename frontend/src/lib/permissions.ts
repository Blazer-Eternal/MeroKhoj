/**
 * Role/permission helpers — pure functions over the role list returned by
 * the backend (`/auth/me` → roles). Backend authorization stays mandatory;
 * these only drive UI visibility and route gating.
 */
import { ADMINISTRATIVE_ROLES, EMPLOYER_ROLES, RoleName } from '@/enums';

export type RoleList = readonly RoleName[];

export const isJobseeker = (roles: RoleList): boolean => roles.includes(RoleName.JOBSEEKER);

export const isEmployer = (roles: RoleList): boolean =>
  EMPLOYER_ROLES.some((r) => roles.includes(r));

export const isAdmin = (roles: RoleList): boolean =>
  ADMINISTRATIVE_ROLES.some((r) => roles.includes(r));

/** Which dashboard area(s) the user may enter, in display priority order. */
export type DashboardArea = 'jobseeker' | 'employer' | 'admin';

export const areasForRoles = (roles: RoleList): DashboardArea[] => {
  const areas: DashboardArea[] = [];
  if (isJobseeker(roles)) areas.push('jobseeker');
  if (isEmployer(roles)) areas.push('employer');
  if (isAdmin(roles)) areas.push('admin');
  return areas;
};

/** The area a user is sent to after login (first granted, admin wins first). */
export const primaryArea = (roles: RoleList): DashboardArea | null => {
  if (isAdmin(roles)) return 'admin';
  if (isEmployer(roles)) return 'employer';
  if (isJobseeker(roles)) return 'jobseeker';
  return null;
};

export const AREA_HOME: Record<DashboardArea, string> = {
  jobseeker: '/jobseeker/dashboard',
  employer: '/employer/dashboard',
  admin: '/admin/dashboard',
};

/** True when the user may open a given pathname (mirrors middleware rules). */
export const canAccessPath = (pathname: string, roles: RoleList): boolean => {
  if (pathname.startsWith('/admin')) return isAdmin(roles);
  if (pathname.startsWith('/employer')) return isEmployer(roles);
  if (pathname.startsWith('/jobseeker')) return isJobseeker(roles);
  return true;
};
