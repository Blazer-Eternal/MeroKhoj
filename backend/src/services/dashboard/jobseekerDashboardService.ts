import type {
  IAuthUser,
  IDashboardApplicationRow,
  IJobseekerDashboard,
} from '../../interfaces';
import {
  applicationRepository,
  dashboardRepository,
  educationRepository,
  jobseekerProfileRepository,
  notificationRepository,
  resumeRepository,
  savedJobRepository,
  workExperienceRepository,
} from '../../repositories';
import { getPaginationParams } from '../../utils';
import { toApplicationRow, toJobCard } from './dashboardMappers';

const RECOMMENDED_JOBS = 6;
const RECENT_APPLICATIONS = 5;

/** Profile completeness: existence, headline, summary, and each credential. */
const completionScore = (
  headline: string | null,
  summary: string | null,
  counts: { educations: number; experiences: number; resumes: number },
): number => {
  let score = 25; // a profile row exists at all
  if (headline) score += 15;
  if (summary) score += 15;
  if (counts.educations > 0) score += 15;
  if (counts.experiences > 0) score += 15;
  if (counts.resumes > 0) score += 15;
  return Math.min(100, score);
};

/**
 * GET /dashboard/jobseeker — counters, profile progress, a fresh job feed
 * and the caller's latest applications, composed in one round-trip batch.
 */
export const getDashboard = async (user: IAuthUser): Promise<IJobseekerDashboard> => {
  const [applications, savedJobs, activeAlerts, unreadNotifications, profile, recent, recommended] =
    await Promise.all([
      dashboardRepository.countApplicationsByJobseeker(user.id),
      savedJobRepository.countByUser(user.id),
      dashboardRepository.countActiveAlerts(user.id),
      notificationRepository.countUnread(user.id),
      jobseekerProfileRepository.findByUserId(user.id),
      applicationRepository.listByJobseeker(
        user.id,
        undefined,
        getPaginationParams({ page: 1, perPage: RECENT_APPLICATIONS }),
      ),
      dashboardRepository.listLatestPublished(RECOMMENDED_JOBS),
    ]);

  let counts = { educations: 0, experiences: 0, resumes: 0 };
  if (profile) {
    const [educations, experiences, resumes] = await Promise.all([
      educationRepository.countByJobseeker(profile.id),
      workExperienceRepository.listByJobseeker(profile.id),
      resumeRepository.countByJobseeker(profile.id),
    ]);
    counts = { educations, experiences: experiences.length, resumes };
  }

  const recentApplications: IDashboardApplicationRow[] = recent.data.map(toApplicationRow);

  return {
    stats: {
      applications,
      savedJobs,
      activeAlerts,
      unreadNotifications,
    },
    profile: {
      exists: profile !== null,
      ...counts,
      completion: profile
        ? completionScore(profile.headline, profile.professional_summary, counts)
        : 0,
    },
    recommendedJobs: recommended.map(toJobCard),
    recentApplications,
  };
};

export const jobseekerDashboardServices = { getDashboard };

export default jobseekerDashboardServices;
