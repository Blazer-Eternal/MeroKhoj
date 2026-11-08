import type { IAuthUser, IEmployerDashboard, IEmployerDashboardStats } from '../../interfaces';
import {
  applicationRepository,
  companyMemberRepository,
  companyRepository,
  dashboardRepository,
} from '../../repositories';
import { ApplicationStatus, JobStatus } from '../../enums';
import { getPaginationParams } from '../../utils';
import { toApplicantRow, toPostingRow, toUpcomingInterview } from './dashboardMappers';

const RECENT_ROWS = 5;

const EMPTY_STATS: IEmployerDashboardStats = {
  activeJobs: 0,
  totalApplications: 0,
  newApplications: 0,
  upcomingInterviews: 0,
  hires: 0,
};

/**
 * GET /dashboard/employer — the recruiter's command view for the first
 * company the caller belongs to: pipeline funnel, upcoming interviews and
 * the latest postings/applicants.
 *
 * No membership yet → `company: null` with zeroed stats so the dashboard
 * can render its "create a company" state instead of failing.
 */
export const getDashboard = async (user: IAuthUser): Promise<IEmployerDashboard> => {
  const companyIds = await companyMemberRepository.listCompanyIdsByUser(user.id);
  const companies = await companyRepository.findByIds(companyIds);
  const company = companies[0] ?? null;

  if (!company) {
    return {
      company: null,
      stats: { ...EMPTY_STATS },
      funnel: [],
      upcomingInterviews: [],
      recentPostings: [],
      recentApplicants: [],
    };
  }

  const companyId = company.id;
  const [jobCounts, funnelCounts, upcomingCount, upcomingRows, postings, applicants] =
    await Promise.all([
      dashboardRepository.countJobsByCompanyStatus(companyId),
      dashboardRepository.countApplicationsByCompanyStatus(companyId),
      dashboardRepository.countUpcomingInterviewsByCompany(companyId),
      dashboardRepository.listUpcomingInterviewsByCompany(companyId, RECENT_ROWS),
      dashboardRepository.listRecentPostings(companyId, RECENT_ROWS),
      applicationRepository.listByCompany(
        companyId,
        {},
        getPaginationParams({ page: 1, perPage: RECENT_ROWS }),
      ),
    ]);

  const totalApplications = Object.values(funnelCounts).reduce((sum, n) => sum + n, 0);

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      verification_status: company.verification_status,
      city: company.city,
    },
    stats: {
      activeJobs: jobCounts[JobStatus.PUBLISHED] ?? 0,
      totalApplications,
      newApplications: funnelCounts[ApplicationStatus.APPLIED] ?? 0,
      upcomingInterviews: upcomingCount,
      hires:
        (funnelCounts[ApplicationStatus.HIRED] ?? 0) +
        (funnelCounts[ApplicationStatus.SELECTED] ?? 0),
    },
    funnel: Object.values(ApplicationStatus).map((status) => ({
      status,
      count: funnelCounts[status] ?? 0,
    })),
    upcomingInterviews: upcomingRows.map(toUpcomingInterview),
    recentPostings: postings.map(toPostingRow),
    recentApplicants: applicants.data.map(toApplicantRow),
  };
};

export const employerDashboardServices = { getDashboard };

export default employerDashboardServices;
