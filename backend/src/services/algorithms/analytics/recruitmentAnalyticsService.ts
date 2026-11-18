import { ApplicationStatus, JobStatus } from '../../../enums';
import {
  analyticsRepository,
  IJobPerformanceRow,
  ISourceCount,
} from '../../../repositories';

/**
 * Recruitment analytics (Phase 1).
 *
 * The shared engine behind the analytics endpoints: one funnel builder and
 * one scope-aware assembler used by the company, job and platform services.
 *
 * Everything derives from the append-only status history so the funnel
 * measures what candidates actually passed through, not just where they
 * currently sit:
 *
 *   applied → under review → shortlisted → interview → selected → hired
 *
 * The funnel is made monotonic by construction: reaching a later stage
 * implies reaching every earlier one, so an odd transition order in the data
 * can never produce a funnel that goes back up.
 */

/** Ordered stages of the hiring funnel. */
export const FUNNEL_STAGES: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.SELECTED,
  ApplicationStatus.HIRED,
];

export interface IFunnelStage {
  status: ApplicationStatus;
  count: number;
  /** Share of the previous stage that reached this one (1 for the first). */
  rate_from_previous: number;
  /** Share of all applications that reached this one. */
  rate_of_total: number;
}

export interface IConversionRates {
  apply_to_review: number;
  review_to_shortlist: number;
  shortlist_to_interview: number;
  interview_to_hire: number;
  overall_hire_rate: number;
}

export interface IAnalyticsVolume {
  applications: number;
  jobs: number;
  active_jobs: number;
  hires: number;
}

export interface IRecruitmentAnalytics {
  scope: 'company' | 'platform';
  company_id: string | null;
  volume: IAnalyticsVolume;
  funnel: IFunnelStage[];
  conversion: IConversionRates;
  time_to_hire: {
    count: number;
    avg_days: number | null;
    min_days: number | null;
    max_days: number | null;
  };
  sources: Array<{ source: string; count: number; share: number }>;
  jobs: Array<{
    id: string;
    title: string;
    status: JobStatus;
    published_at: Date | null;
    applications: number;
    shortlisted: number;
    interviewed: number;
    hired: number;
    hire_rate: number;
  }>;
}

const ratio = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 1000 : 0;

/** Force the funnel monotonic: a later stage implies all earlier ones. */
const monotonicCounts = (
  reached: Record<ApplicationStatus, number>,
): Record<ApplicationStatus, number> => {
  const result = {} as Record<ApplicationStatus, number>;
  let carry = 0;
  // Walk from the last stage backwards: stage[i] = max(reached[i], stage[i+1]).
  for (let index = FUNNEL_STAGES.length - 1; index >= 0; index -= 1) {
    const status = FUNNEL_STAGES[index];
    carry = Math.max(reached[status] ?? 0, carry);
    result[status] = carry;
  }
  return result;
};

/** Build the funnel + conversion block from ever-reached counts. */
export const buildFunnel = (
  reached: Record<ApplicationStatus, number>,
  totalApplications: number,
): { funnel: IFunnelStage[]; conversion: IConversionRates } => {
  const counts = monotonicCounts(reached);

  const funnel: IFunnelStage[] = FUNNEL_STAGES.map((status, index) => {
    const count = counts[status];
    const previous = index === 0 ? count : counts[FUNNEL_STAGES[index - 1]];
    return {
      status,
      count,
      rate_from_previous: index === 0 ? 1 : ratio(count, previous),
      rate_of_total: ratio(count, totalApplications),
    };
  });

  const at = (status: ApplicationStatus): number => counts[status];
  const conversion: IConversionRates = {
    apply_to_review: ratio(at(ApplicationStatus.UNDER_REVIEW), at(ApplicationStatus.APPLIED)),
    review_to_shortlist: ratio(at(ApplicationStatus.SHORTLISTED), at(ApplicationStatus.UNDER_REVIEW)),
    shortlist_to_interview: ratio(at(ApplicationStatus.INTERVIEW), at(ApplicationStatus.SHORTLISTED)),
    interview_to_hire: ratio(at(ApplicationStatus.HIRED), at(ApplicationStatus.INTERVIEW)),
    overall_hire_rate: ratio(at(ApplicationStatus.HIRED), totalApplications),
  };

  return { funnel, conversion };
};

/** Raw-data assembler shared by the company/job/platform entry points. */
export const buildAnalytics = async (
  scope: 'company' | 'platform',
  companyId: string | null,
): Promise<IRecruitmentAnalytics> => {
  const repositoryScope = companyId ? { companyId } : {};

  const [current, reached, performance, timeToHire, sources, jobCounts] = await Promise.all([
    analyticsRepository.countApplicationsByStatus(repositoryScope),
    analyticsRepository.countEverReachedStatus(repositoryScope),
    analyticsRepository.jobPerformance(repositoryScope),
    analyticsRepository.timeToHire(repositoryScope),
    analyticsRepository.countApplicationsBySource(repositoryScope),
    analyticsRepository.countJobsByStatus(repositoryScope),
  ]);

  const totalApplications = Object.values(current).reduce((sum, count) => sum + count, 0);
  const { funnel, conversion } = buildFunnel(reached, totalApplications);
  const totalSources = sources.reduce((sum, row) => sum + row.count, 0);

  return {
    scope,
    company_id: companyId,
    volume: {
      applications: totalApplications,
      jobs: Object.values(jobCounts).reduce((sum, count) => sum + count, 0),
      active_jobs: jobCounts[JobStatus.PUBLISHED] ?? 0,
      hires: current[ApplicationStatus.HIRED] ?? 0,
    },
    funnel,
    conversion,
    time_to_hire: timeToHire,
    sources: sources.map((row: ISourceCount) => ({
      source: row.source,
      count: row.count,
      share: ratio(row.count, totalSources),
    })),
    jobs: (performance as IJobPerformanceRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      published_at: row.published_at,
      applications: row.applications,
      shortlisted: row.shortlisted,
      interviewed: row.interviewed,
      hired: row.hired,
      hire_rate: ratio(row.hired, row.applications),
    })),
  };
};

/** Platform-wide recruitment analytics (admin dashboard). */
export const getPlatformAnalytics = async (): Promise<IRecruitmentAnalytics> =>
  buildAnalytics('platform', null);

export const recruitmentAnalyticsService = {
  FUNNEL_STAGES,
  buildFunnel,
  buildAnalytics,
  getPlatformAnalytics,
};

export default recruitmentAnalyticsService;
