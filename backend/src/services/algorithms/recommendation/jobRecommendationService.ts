import {
  buildPaginationMeta,
  getPaginationParams,
  IPaginationQuery,
} from '../../../utils';
import { IAuthUser, IJob } from '../../../interfaces';
import {
  applicationRepository,
  educationRepository,
  jobRepository,
  jobseekerProfileRepository,
  jobseekerProfileSkillRepository,
  workExperienceRepository,
} from '../../../repositories';
import {
  buildProfileSignals,
  IRankableJob,
  rankJobsForCandidate,
} from '../ranking/jobRankingService';

/**
 * Job recommendation feed (Phase 1 algorithm).
 *
 * Assembles the personalized "recommended jobs" list: it loads the
 * candidate's profile signals once, scores every open posting against them
 * (ranking lives in `ranking/jobRankingService`) and paginates the result.
 *
 * Jobs the candidate already applied to are excluded up front, and a
 * candidate with no profile yet simply gets the newest openings.
 */

/** The feed entry: a job plus its ranking score. */
export type RecommendedJob = IRankableJob & { score: number };

/**
 * GET /jobs/recommended — paginated personalized feed.
 * Without a profile the response is simply the newest open jobs.
 */
export const getRecommendedJobs = async (
  user: IAuthUser,
  query: IPaginationQuery,
) => {
  const pagination = getPaginationParams(query);
  const appliedJobIds = await applicationRepository.findAppliedJobIds(user.id);
  const jobs = await jobRepository.listOpenForCandidate(appliedJobIds);

  const profile = await jobseekerProfileRepository.findByUserId(user.id);
  if (!profile) {
    const sliced = jobs.slice(pagination.offset, pagination.offset + pagination.limit);
    return {
      data: sliced as IJob[],
      meta: buildPaginationMeta(jobs.length, pagination.page, pagination.perPage),
    };
  }

  const [profileSkills, educations, experiences] = await Promise.all([
    jobseekerProfileSkillRepository.listByUserId(user.id),
    educationRepository.listByJobseeker(profile.id),
    workExperienceRepository.listByJobseeker(profile.id),
  ]);

  const signals = buildProfileSignals(profile, profileSkills, educations, experiences);
  const scored: RecommendedJob[] = rankJobsForCandidate(jobs, signals);

  const sliced = scored.slice(pagination.offset, pagination.offset + pagination.limit);
  return {
    data: sliced as IJob[],
    meta: buildPaginationMeta(scored.length, pagination.page, pagination.perPage),
  };
};

export const jobRecommendationService = { getRecommendedJobs };

export default jobRecommendationService;
