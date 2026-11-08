import type { IAdminDashboard } from '../../interfaces';
import { applicationRepository, dashboardRepository } from '../../repositories';
import { ApplicationStatus, JobStatus } from '../../enums';

/**
 * GET /dashboard/admin — platform-wide counters, pipeline breakdowns and
 * the newest postings. Pure read model: no admin mutation lives here.
 */
export const getDashboard = async (): Promise<IAdminDashboard> => {
  const [users, companies, jobsByStatus, applicationCounts, pendingVerifications, recent] =
    await Promise.all([
      dashboardRepository.countUsers(),
      dashboardRepository.countCompanies(),
      dashboardRepository.countJobsByStatus(),
      applicationRepository.countByStatus({}),
      dashboardRepository.countPendingVerifications(),
      dashboardRepository.listRecentPostingsGlobal(8),
    ]);

  const jobs = Object.values(jobsByStatus).reduce((sum, n) => sum + n, 0);
  const applications = Object.values(applicationCounts).reduce((sum, n) => sum + n, 0);

  return {
    stats: {
      users,
      companies,
      jobs,
      publishedJobs: jobsByStatus[JobStatus.PUBLISHED] ?? 0,
      applications,
      pendingVerifications,
    },
    jobsByStatus: Object.values(JobStatus).map((status) => ({
      status,
      count: jobsByStatus[status] ?? 0,
    })),
    applicationsByStatus: Object.values(ApplicationStatus).map((status) => ({
      status,
      count: applicationCounts[status] ?? 0,
    })),
    recentPostings: recent.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      published_at: row.published_at,
      created_at: row.created_at,
      company_name: row.company?.name ?? null,
    })),
  };
};

export const adminDashboardServices = { getDashboard };

export default adminDashboardServices;
