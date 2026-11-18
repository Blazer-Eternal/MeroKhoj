import { ApplicationStatus, ApplicationSource, JobStatus } from '../../enums';
import Application from '../../models/application/applicationModel';
import Job from '../../models/job/jobModel';

/**
 * Read-model repository for the recruitment analytics endpoints.
 *
 * Like `dashboardRepository`, this one is allowed to join across tables
 * because analytics ARE cross-table aggregates; it never writes. Grouping is
 * done with raw SQL where a Sequelize `group` + `include` would be ambiguous.
 *
 * Every method takes a scope: `{ companyId }` for one company's pipeline,
 * `{ jobId }` for a single posting, or `{}` for the whole platform — so the
 * company, job and admin analytics services share one set of queries.
 */

export interface IAnalyticsScope {
  companyId?: string;
  jobId?: string;
}

export interface IStageCount {
  status: ApplicationStatus;
  count: number;
}

export interface ITimeToHire {
  count: number;
  avg_days: number | null;
  min_days: number | null;
  max_days: number | null;
}

export interface ISourceCount {
  source: ApplicationSource;
  count: number;
}

export interface IJobPerformanceRow {
  id: string;
  title: string;
  status: JobStatus;
  published_at: Date | null;
  applications: number;
  shortlisted: number;
  interviewed: number;
  hired: number;
}

export interface ISalaryRow {
  salary_min: number;
  salary_max: number;
  salary_currency: string;
}

/** WHERE/JOIN fragment scoping a query on the `applications` table. */
const applicationScope = (
  scope: IAnalyticsScope,
): { sql: string; replacements: Record<string, string> } => {
  if (scope.jobId) return { sql: 'WHERE a.job_id = :jobId', replacements: { jobId: scope.jobId } };
  if (scope.companyId) {
    return {
      sql: 'JOIN jobs j ON j.id = a.job_id WHERE j.company_id = :companyId',
      replacements: { companyId: scope.companyId },
    };
  }
  return { sql: '', replacements: {} };
};

/** WHERE/JOIN fragment scoping a query rooted at `application_status_history`. */
const historyScope = (
  scope: IAnalyticsScope,
): { sql: string; replacements: Record<string, string> } => {
  if (scope.jobId) {
    return {
      sql: 'WHERE h.application_id IN (SELECT id FROM applications WHERE job_id = :jobId)',
      replacements: { jobId: scope.jobId },
    };
  }
  if (scope.companyId) {
    return {
      sql: `JOIN applications a ON a.id = h.application_id
            JOIN jobs j ON j.id = a.job_id
            WHERE j.company_id = :companyId`,
      replacements: { companyId: scope.companyId },
    };
  }
  return { sql: '', replacements: {} };
};

/** WHERE fragment scoping a query on the `jobs` table. */
const jobScope = (
  scope: IAnalyticsScope,
): { sql: string; replacements: Record<string, string> } => {
  if (scope.jobId) return { sql: 'WHERE id = :jobId', replacements: { jobId: scope.jobId } };
  if (scope.companyId) {
    return { sql: 'WHERE company_id = :companyId', replacements: { companyId: scope.companyId } };
  }
  return { sql: '', replacements: {} };
};

/** WHERE fragment for the job-performance query (jobs is the outer table). */
const performanceScope = (
  scope: IAnalyticsScope,
): { sql: string; replacements: Record<string, string> } => {
  if (scope.jobId) return { sql: 'WHERE j.id = :jobId', replacements: { jobId: scope.jobId } };
  if (scope.companyId) {
    return { sql: 'WHERE j.company_id = :companyId', replacements: { companyId: scope.companyId } };
  }
  return { sql: '', replacements: {} };
};

const zeroedStatuses = <T extends string>(values: readonly T[]): Record<T, number> => {
  const counts = {} as Record<T, number>;
  for (const value of values) counts[value] = 0;
  return counts;
};

class AnalyticsRepository {
  /** Applications per current status (snapshot of every pipeline). */
  async countApplicationsByStatus(scope: IAnalyticsScope = {}): Promise<
    Record<ApplicationStatus, number>
  > {
    const { sql, replacements } = applicationScope(scope);
    const rows = (await Application.sequelize!.query(
      `SELECT a.status, COUNT(*)::int AS count
       FROM applications a
       ${sql}
       GROUP BY a.status`,
      { replacements, type: 'SELECT' as const },
    )) as Array<{ status: ApplicationStatus; count: number }>;

    const counts = zeroedStatuses(Object.values(ApplicationStatus) as ApplicationStatus[]);
    for (const row of rows) counts[row.status] = row.count;
    return counts;
  }

  /**
   * How many applications EVER reached each status (append-only history).
   * This is what a conversion funnel needs — a rejected candidate still
   * passed through the stages before it.
   */
  async countEverReachedStatus(scope: IAnalyticsScope = {}): Promise<
    Record<ApplicationStatus, number>
  > {
    const { sql, replacements } = historyScope(scope);
    const rows = (await Application.sequelize!.query(
      `SELECT h.new_status AS status, COUNT(DISTINCT h.application_id)::int AS count
       FROM application_status_history h
       ${sql}
       GROUP BY h.new_status`,
      { replacements, type: 'SELECT' as const },
    )) as Array<{ status: ApplicationStatus; count: number }>;

    const counts = zeroedStatuses(Object.values(ApplicationStatus) as ApplicationStatus[]);
    for (const row of rows) counts[row.status] = row.count;
    return counts;
  }

  /** Days from application to first HIRED transition (completed hires only). */
  async timeToHire(scope: IAnalyticsScope = {}): Promise<ITimeToHire> {
    const { sql, replacements } = applicationScope(scope);
    const rows = (await Application.sequelize!.query(
      `SELECT COUNT(*)::int AS count,
              ROUND(AVG(days)::numeric, 1) AS avg_days,
              ROUND(MIN(days)::numeric, 1) AS min_days,
              ROUND(MAX(days)::numeric, 1) AS max_days
       FROM (
         SELECT a.id, EXTRACT(EPOCH FROM (MIN(h.created_at) - a.applied_at)) / 86400 AS days
         FROM applications a
         JOIN application_status_history h
           ON h.application_id = a.id AND h.new_status = 'HIRED'
         ${sql}
         GROUP BY a.id, a.applied_at
       ) hires`,
      { replacements, type: 'SELECT' as const },
    )) as Array<{
      count: number;
      avg_days: string | null;
      min_days: string | null;
      max_days: string | null;
    }>;

    const row = rows[0];
    const toNumber = (value: string | null | undefined): number | null =>
      value !== null && value !== undefined ? Number(value) : null;

    return {
      count: row?.count ?? 0,
      avg_days: toNumber(row?.avg_days),
      min_days: toNumber(row?.min_days),
      max_days: toNumber(row?.max_days),
    };
  }

  /** Applications grouped by how the candidate found the posting. */
  async countApplicationsBySource(scope: IAnalyticsScope = {}): Promise<ISourceCount[]> {
    const { sql, replacements } = applicationScope(scope);
    const rows = (await Application.sequelize!.query(
      `SELECT a.source, COUNT(*)::int AS count
       FROM applications a
       ${sql}
       GROUP BY a.source
       ORDER BY count DESC`,
      { replacements, type: 'SELECT' as const },
    )) as Array<{ source: ApplicationSource; count: number }>;
    return rows;
  }

  /** Per-job pipeline performance (applications → stages → hires). */
  async jobPerformance(scope: IAnalyticsScope = {}): Promise<IJobPerformanceRow[]> {
    const { sql, replacements } = performanceScope(scope);
    const rows = (await Application.sequelize!.query(
      `SELECT j.id, j.title, j.status, j.published_at,
              COUNT(a.id)::int AS applications,
              COUNT(a.id) FILTER (WHERE a.status IN ('SHORTLISTED','INTERVIEW','SELECTED','HIRED'))::int AS shortlisted,
              COUNT(a.id) FILTER (WHERE a.status IN ('INTERVIEW','SELECTED','HIRED'))::int AS interviewed,
              COUNT(a.id) FILTER (WHERE a.status = 'HIRED')::int AS hired
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       ${sql}
       GROUP BY j.id
       ORDER BY applications DESC, j.created_at DESC`,
      { replacements, type: 'SELECT' as const },
    )) as IJobPerformanceRow[];
    return rows;
  }

  /** Job counts by status (volume block of the analytics payload). */
  async countJobsByStatus(scope: IAnalyticsScope = {}): Promise<Record<JobStatus, number>> {
    const { sql, replacements } = jobScope(scope);
    const rows = (await Job.sequelize!.query(
      `SELECT status, COUNT(*)::int AS count FROM jobs ${sql} GROUP BY status`,
      { replacements, type: 'SELECT' as const },
    )) as Array<{ status: JobStatus; count: number }>;

    const counts = zeroedStatuses(Object.values(JobStatus) as JobStatus[]);
    for (const row of rows) counts[row.status] = row.count;
    return counts;
  }

  /**
   * Published salary samples for the estimator. Filters are applied as far as
   * they still leave data; the service widens them progressively and calls
   * this once per tier.
   */
  async salaryRows(filters: {
    category_id?: string | null;
    location_id?: string | null;
    experience_level?: string | null;
  }): Promise<ISalaryRow[]> {
    const clauses = [
      `status = 'PUBLISHED'`,
      'salary_min IS NOT NULL',
      'salary_max IS NOT NULL',
    ];
    const replacements: Record<string, string> = {};
    if (filters.category_id) {
      clauses.push('category_id = :categoryId');
      replacements.categoryId = filters.category_id;
    }
    if (filters.location_id) {
      clauses.push('location_id = :locationId');
      replacements.locationId = filters.location_id;
    }
    if (filters.experience_level) {
      clauses.push('experience_level = :experienceLevel');
      replacements.experienceLevel = filters.experience_level;
    }

    return (await Job.sequelize!.query(
      `SELECT salary_min::float AS salary_min, salary_max::float AS salary_max, salary_currency
       FROM jobs
       WHERE ${clauses.join(' AND ')}`,
      { replacements, type: 'SELECT' as const },
    )) as ISalaryRow[];
  }
}

export default new AnalyticsRepository();
