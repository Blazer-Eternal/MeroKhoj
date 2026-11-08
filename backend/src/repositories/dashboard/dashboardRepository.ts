import { Op } from 'sequelize';
import Job from '../../models/job/jobModel';
import Company from '../../models/company/companyModel';
import User from '../../models/user/userModel';
import Application from '../../models/application/applicationModel';
import Interview from '../../models/interview/interviewModel';
import JobAlert from '../../models/notification/jobAlertModel';
import CompanyVerification from '../../models/company/companyVerificationModel';
import { IJob, IInterview } from '../../interfaces';
import {
  JobStatus,
  ApplicationStatus,
  CompanyVerificationStatus,
  INTERVIEW_UPCOMING_STATUSES,
} from '../../enums';

/**
 * Read-model repository for the three dashboards.
 *
 * Unlike feature repositories (one table each), this one is allowed to reach
 * across tables because a dashboard IS a cross-table aggregate. It never
 * writes. Grouped counts use raw SQL where a Sequelize `group` + `include`
 * combination would be ambiguous, mirroring the approach already used by
 * `jobRepository.countByStatusForJob`.
 */

type StatusCounts<T extends string> = Record<T, number>;

const zeroed = <T extends string>(values: readonly T[]): StatusCounts<T> => {
  const counts = {} as StatusCounts<T>;
  for (const value of values) counts[value] = 0;
  return counts;
};

/** A job row with its company association attached (not part of IJob). */
export type IDashboardJobRow = IJob & {
  company?: { id: string; name: string } | null;
};

/** An interview row with application → job + applicant attached. */
export type IDashboardInterviewRow = IInterview & {
  application?: {
    id: string;
    job?: { id: string; title: string } | null;
    jobseeker?: { id: string; first_name: string; last_name: string } | null;
  } | null;
};

class DashboardRepository {
  // -------------------------------------------------------------------------
  // Jobseeker
  // -------------------------------------------------------------------------

  async countApplicationsByJobseeker(userId: string): Promise<number> {
    return Application.count({ where: { jobseeker_id: userId } });
  }

  async countActiveAlerts(userId: string): Promise<number> {
    return JobAlert.count({ where: { user_id: userId, is_active: true } });
  }

  /** Latest published jobs with the hiring company's name attached. */
  async listLatestPublished(limit = 6): Promise<IDashboardJobRow[]> {
    const rows = await Job.findAll({
      where: { status: JobStatus.PUBLISHED },
      order: [['published_at', 'DESC']],
      limit,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    });
    return rows as unknown as IDashboardJobRow[];
  }

  // -------------------------------------------------------------------------
  // Employer (company-scoped)
  // -------------------------------------------------------------------------

  /** Job counts per status for one company. */
  async countJobsByCompanyStatus(companyId: string): Promise<StatusCounts<JobStatus>> {
    const rows =
      (await Job.sequelize?.query(
        `SELECT status, COUNT(*)::int AS count
         FROM jobs
         WHERE company_id = :companyId
         GROUP BY status`,
        { replacements: { companyId }, type: 'SELECT' as const },
      )) ?? [];
    const counts = zeroed(Object.values(JobStatus));
    for (const row of rows as Array<{ status: JobStatus; count: number }>) {
      counts[row.status] = row.count;
    }
    return counts;
  }

  /** Application funnel across a company's jobs (joined through `jobs`). */
  async countApplicationsByCompanyStatus(
    companyId: string,
  ): Promise<StatusCounts<ApplicationStatus>> {
    const rows =
      (await Application.sequelize?.query(
        `SELECT a.status, COUNT(*)::int AS count
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         WHERE j.company_id = :companyId
         GROUP BY a.status`,
        { replacements: { companyId }, type: 'SELECT' as const },
      )) ?? [];
    const counts = zeroed(Object.values(ApplicationStatus));
    for (const row of rows as Array<{ status: ApplicationStatus; count: number }>) {
      counts[row.status] = row.count;
    }
    return counts;
  }

  /** Interviews still ahead on a company's jobs (scheduled/confirmed). */
  async countUpcomingInterviewsByCompany(companyId: string): Promise<number> {
    const rows = (await Interview.sequelize?.query(
      `SELECT COUNT(*)::int AS count
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN jobs j ON j.id = a.job_id
       WHERE j.company_id = :companyId
         AND i.status IN (:upcoming)`,
      {
        replacements: { companyId, upcoming: INTERVIEW_UPCOMING_STATUSES },
        type: 'SELECT' as const,
      },
    )) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  }

  /** Newest jobs of a company, any status (recruiter "recent postings"). */
  async listRecentPostings(companyId: string, limit = 5): Promise<IDashboardJobRow[]> {
    const rows = await Job.findAll({
      where: { company_id: companyId },
      order: [['created_at', 'DESC']],
      limit,
    });
    return rows as unknown as IDashboardJobRow[];
  }

  /** Next interviews on a company's jobs with candidate + job titles. */
  async listUpcomingInterviewsByCompany(
    companyId: string,
    limit = 5,
  ): Promise<IDashboardInterviewRow[]> {
    const rows = await Interview.findAll({
      where: { status: { [Op.in]: INTERVIEW_UPCOMING_STATUSES } },
      order: [['scheduled_at', 'ASC']],
      limit,
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['id'],
          include: [
            { model: Job, as: 'job', attributes: ['id', 'title'], where: { company_id: companyId } },
            {
              model: User,
              as: 'jobseeker',
              attributes: ['id', 'first_name', 'last_name'],
            },
          ],
        },
      ],
    });
    return rows as unknown as IDashboardInterviewRow[];
  }

  // -------------------------------------------------------------------------
  // Admin (platform-wide)
  // -------------------------------------------------------------------------

  async countUsers(): Promise<number> {
    return User.count();
  }

  async countCompanies(): Promise<number> {
    return Company.count();
  }

  /** Job counts per status across the whole board. */
  async countJobsByStatus(): Promise<StatusCounts<JobStatus>> {
    const rows =
      (await Job.sequelize?.query(
        `SELECT status, COUNT(*)::int AS count FROM jobs GROUP BY status`,
        { type: 'SELECT' as const },
      )) ?? [];
    const counts = zeroed(Object.values(JobStatus));
    for (const row of rows as Array<{ status: JobStatus; count: number }>) {
      counts[row.status] = row.count;
    }
    return counts;
  }

  async countPendingVerifications(): Promise<number> {
    return CompanyVerification.count({ where: { status: CompanyVerificationStatus.PENDING } });
  }

  /** Newest postings across the board, with company names (admin feed). */
  async listRecentPostingsGlobal(limit = 8): Promise<IDashboardJobRow[]> {
    const rows = await Job.findAll({
      order: [['created_at', 'DESC']],
      limit,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    });
    return rows as unknown as IDashboardJobRow[];
  }
}

export default new DashboardRepository();
