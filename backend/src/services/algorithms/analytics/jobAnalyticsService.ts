import { AppError } from '../../../utils';
import { ApplicationStatus, JobStatus } from '../../../enums';
import {
  analyticsRepository,
  IJobPerformanceRow,
  ISourceCount,
  jobRepository,
} from '../../../repositories';
import { IAuthUser } from '../../../interfaces';
import { assertCanManageJobs } from '../../shared/accessControl';
import {
  buildFunnel,
  IFunnelStage,
  IConversionRates,
} from './recruitmentAnalyticsService';

/**
 * Job performance analytics (Phase 1).
 *
 * Everything about ONE posting: how many people applied, where they are in
 * the funnel, how fast hires happened and which sources they came from —
 * plus the cross-job performance table used by the recruitment dashboards.
 */

export interface IJobAnalytics {
  job: {
    id: string;
    title: string;
    status: JobStatus;
    published_at: Date | null;
    company_id: string;
    vacancies: number;
    application_deadline: Date | null;
  };
  volume: {
    applications: number;
    in_process: number;
    hired: number;
    rejected: number;
    withdrawn: number;
  };
  funnel: IFunnelStage[];
  conversion: IConversionRates;
  time_to_hire: {
    count: number;
    avg_days: number | null;
    min_days: number | null;
    max_days: number | null;
  };
  sources: Array<{ source: string; count: number; share: number }>;
  performance: {
    applications: number;
    shortlisted: number;
    interviewed: number;
    hired: number;
    hire_rate: number;
  };
}

const ratio = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 1000 : 0;

/** Single-posting analytics. Throws 404 when the job does not exist. */
export const getJobAnalytics = async (jobId: string): Promise<IJobAnalytics> => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');

  const scope = { jobId };
  const [current, reached, timeToHire, sources, performance] = await Promise.all([
    analyticsRepository.countApplicationsByStatus(scope),
    analyticsRepository.countEverReachedStatus(scope),
    analyticsRepository.timeToHire(scope),
    analyticsRepository.countApplicationsBySource(scope),
    analyticsRepository.jobPerformance(scope),
  ]);

  const total = Object.values(current).reduce((sum, count) => sum + count, 0);
  const { funnel, conversion } = buildFunnel(reached, total);
  const totalSources = sources.reduce((sum, row) => sum + row.count, 0);
  const row = (performance as IJobPerformanceRow[])[0];

  return {
    job: {
      id: job.id,
      title: job.title,
      status: job.status,
      published_at: job.published_at,
      company_id: job.company_id,
      vacancies: job.vacancies,
      application_deadline: job.application_deadline,
    },
    volume: {
      applications: total,
      in_process:
        total -
        (current[ApplicationStatus.HIRED] ?? 0) -
        (current[ApplicationStatus.REJECTED] ?? 0) -
        (current[ApplicationStatus.WITHDRAWN] ?? 0),
      hired: current[ApplicationStatus.HIRED] ?? 0,
      rejected: current[ApplicationStatus.REJECTED] ?? 0,
      withdrawn: current[ApplicationStatus.WITHDRAWN] ?? 0,
    },
    funnel,
    conversion,
    time_to_hire: timeToHire,
    sources: sources.map((entry: ISourceCount) => ({
      source: entry.source,
      count: entry.count,
      share: ratio(entry.count, totalSources),
    })),
    performance: {
      applications: row?.applications ?? 0,
      shortlisted: row?.shortlisted ?? 0,
      interviewed: row?.interviewed ?? 0,
      hired: row?.hired ?? 0,
      hire_rate: ratio(row?.hired ?? 0, row?.applications ?? 0),
    },
  };
};

/**
 * Job analytics for an authenticated employer: the job's company must be one
 * the user can manage before any numbers are revealed.
 */
export const getJobAnalyticsForUser = async (
  user: IAuthUser,
  jobId: string,
): Promise<IJobAnalytics> => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');
  await assertCanManageJobs(user, job.company_id);
  return getJobAnalytics(jobId);
};

/** Cross-job performance table (optionally scoped to a company). */export const listJobPerformance = async (
  scope: { companyId?: string } = {},
): Promise<
  Array<{
    id: string;
    title: string;
    status: JobStatus;
    published_at: Date | null;
    applications: number;
    shortlisted: number;
    interviewed: number;
    hired: number;
    hire_rate: number;
  }>
> => {
  const rows = await analyticsRepository.jobPerformance(scope);
  return (rows as IJobPerformanceRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    published_at: row.published_at,
    applications: row.applications,
    shortlisted: row.shortlisted,
    interviewed: row.interviewed,
    hired: row.hired,
    hire_rate: ratio(row.hired, row.applications),
  }));
};

export const jobAnalyticsService = {
  getJobAnalytics,
  getJobAnalyticsForUser,
  listJobPerformance,
};

export default jobAnalyticsService;
