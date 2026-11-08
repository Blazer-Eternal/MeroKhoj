import { ApplicationStatus, JobStatus } from '../../enums';

/**
 * Dashboard payloads — read-only aggregates over existing tables.
 *
 * Dashboards add no tables of their own: every field is derived from data
 * another feature already owns, which is why these types stay flat and
 * self-contained instead of reusing entity interfaces.
 */

// ---------------------------------------------------------------------------
// Shared row shapes
// ---------------------------------------------------------------------------

export interface IStatusCount<T extends string = string> {
  status: T;
  count: number;
}

/** Compact job card used on jobseeker + employer dashboards. */
export interface IDashboardJobCard {
  id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  published_at: Date | null;
}

/** A job posting as the employer/admin sees it (any status). */
export interface IDashboardPostingRow {
  id: string;
  title: string;
  status: JobStatus;
  published_at: Date | null;
  created_at: Date;
  /** Attached on the admin feed; null for the employer's own postings. */
  company_name: string | null;
}

/** One application in a dashboard list. */
export interface IDashboardApplicationRow {
  id: string;
  job_id: string;
  job_title: string | null;
  status: ApplicationStatus;
  applied_at: Date;
}

// ---------------------------------------------------------------------------
// GET /dashboard/jobseeker
// ---------------------------------------------------------------------------

export interface IJobseekerDashboardStats {
  applications: number;
  savedJobs: number;
  activeAlerts: number;
  unreadNotifications: number;
}

export interface IJobseekerProfileProgress {
  exists: boolean;
  educations: number;
  experiences: number;
  resumes: number;
  /** 0-100 — headline, summary and one of each credential each weigh in. */
  completion: number;
}

export interface IJobseekerDashboard {
  stats: IJobseekerDashboardStats;
  profile: IJobseekerProfileProgress;
  recommendedJobs: IDashboardJobCard[];
  recentApplications: IDashboardApplicationRow[];
}

// ---------------------------------------------------------------------------
// GET /dashboard/employer
// ---------------------------------------------------------------------------

export interface IEmployerDashboardCompany {
  id: string;
  name: string;
  slug: string;
  verification_status: string;
  city: string | null;
}

export interface IEmployerDashboardStats {
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  upcomingInterviews: number;
  hires: number;
}

export interface IEmployerUpcomingInterview {
  id: string;
  scheduled_at: Date;
  interview_type: string;
  status: string;
  candidate_name: string;
  job_title: string;
}

export interface IEmployerApplicantRow {
  id: string;
  candidate_name: string;
  job_title: string;
  status: ApplicationStatus;
  applied_at: Date;
}

export interface IEmployerDashboard {
  /** Null until the employer has (at least) one company membership. */
  company: IEmployerDashboardCompany | null;
  stats: IEmployerDashboardStats;
  /** Applications across the company's jobs, grouped by pipeline status. */
  funnel: IStatusCount<ApplicationStatus>[];
  upcomingInterviews: IEmployerUpcomingInterview[];
  recentPostings: IDashboardPostingRow[];
  recentApplicants: IEmployerApplicantRow[];
}

// ---------------------------------------------------------------------------
// GET /dashboard/admin
// ---------------------------------------------------------------------------

export interface IAdminDashboardStats {
  users: number;
  companies: number;
  jobs: number;
  publishedJobs: number;
  applications: number;
  pendingVerifications: number;
}

export interface IAdminDashboard {
  stats: IAdminDashboardStats;
  jobsByStatus: IStatusCount<JobStatus>[];
  applicationsByStatus: IStatusCount<ApplicationStatus>[];
  recentPostings: IDashboardPostingRow[];
}
