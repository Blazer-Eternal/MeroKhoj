/** App-wide constants (labels, limits, routing rules). */

export const APP_NAME = 'MeroKhoj';
export const APP_TAGLINE = "Find what's yours.";

/** Dashboard home per primary role (used by middleware + post-login redirect). */
export const ROLE_HOME = {
  JOBSEEKER: '/jobseeker/dashboard',
  EMPLOYER: '/employer/dashboard',
  ADMIN: '/admin/dashboard',
} as const;

/** Route prefixes each role area is gated behind (src/middleware.ts). */
export const PROTECTED_PREFIXES = {
  jobseeker: '/jobseeker',
  employer: '/employer',
  admin: '/admin',
} as const;

/** Public job search filter options (labels for selects). */
export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
  FREELANCE: 'Freelance',
};

export const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  ENTRY: 'Entry level',
  MID: 'Mid level',
  SENIOR: 'Senior level',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
};

export const COMPANY_SIZE_LABELS: Record<string, string> = {
  SOLO: '1-10',
  SMALL: '11-50',
  MEDIUM: '51-200',
  LARGE: '201-1000',
  ENTERPRISE: '1000+',
};

export const COMPANY_ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Company admin',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring manager',
  VIEWER: 'Viewer',
};

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  PHONE: 'Phone',
  VIDEO: 'Video call',
  IN_PERSON: 'In person',
  TECHNICAL: 'Technical round',
  HR: 'HR round',
  FINAL: 'Final round',
};

export const DATE_FORMAT = 'MMM d, yyyy';
export const DEFAULT_PAGE_SIZE = 12;

