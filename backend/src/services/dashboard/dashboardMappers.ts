import type {
  IApplication,
  IDashboardApplicationRow,
  IDashboardJobCard,
  IDashboardPostingRow,
  IEmployerApplicantRow,
  IEmployerUpcomingInterview,
} from '../../interfaces';
import type { IDashboardInterviewRow, IDashboardJobRow } from '../../repositories';

/**
 * Row → payload mappers shared by the three dashboard services.
 * Kept feature-internal (direct imports, no barrel) per STRUCTURE.md §6.2.
 */

export const toJobCard = (row: IDashboardJobRow): IDashboardJobCard => ({
  id: row.id,
  title: row.title,
  company_name: row.company?.name ?? null,
  location: row.location,
  employment_type: row.employment_type,
  salary_min: row.salary_min,
  salary_max: row.salary_max,
  salary_currency: row.salary_currency,
  published_at: row.published_at,
});

export const toPostingRow = (row: IDashboardJobRow): IDashboardPostingRow => ({
  id: row.id,
  title: row.title,
  status: row.status,
  published_at: row.published_at,
  created_at: row.created_at,
  company_name: row.company?.name ?? null,
});

type ApplicationWithJoins = IApplication & {
  job?: { id?: string; title?: string } | undefined;
  jobseeker?: { first_name?: string | null; last_name?: string | null } | undefined;
};

export const toApplicationRow = (app: ApplicationWithJoins): IDashboardApplicationRow => {
  const job = app.job;
  return {
    id: app.id,
    job_id: app.job_id,
    job_title: job?.title ?? null,
    status: app.status,
    applied_at: app.applied_at,
  };
};

export const toApplicantRow = (app: ApplicationWithJoins): IEmployerApplicantRow => {
  const job = app.job;
  const seeker = app.jobseeker;
  const name = [seeker?.first_name, seeker?.last_name].filter(Boolean).join(' ').trim();
  return {
    id: app.id,
    candidate_name: name || 'Candidate',
    job_title: job?.title ?? 'Untitled role',
    status: app.status,
    applied_at: app.applied_at,
  };
};

export const toUpcomingInterview = (row: IDashboardInterviewRow): IEmployerUpcomingInterview => {
  const seeker = row.application?.jobseeker;
  const name = [seeker?.first_name, seeker?.last_name].filter(Boolean).join(' ').trim();
  return {
    id: row.id,
    scheduled_at: row.scheduled_at,
    interview_type: row.interview_type,
    status: row.status,
    candidate_name: name || 'Candidate',
    job_title: row.application?.job?.title ?? 'Interview',
  };
};
