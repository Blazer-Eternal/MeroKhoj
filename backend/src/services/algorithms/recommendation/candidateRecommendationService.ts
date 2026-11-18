import {
  buildPaginationMeta,
  getPaginationParams,
  IPaginationQuery,
} from '../../../utils';
import { IAuthUser, IEducation, IWorkExperience } from '../../../interfaces';
import {
  educationRepository,
  jobseekerProfileRepository,
  jobseekerProfileSkillRepository,
  workExperienceRepository,
} from '../../../repositories';
import { assertCanManageJobs } from '../../shared/accessControl';
import {
  highestEducationLevel,
  yearsOfExperience,
} from '../matching/jobMatchingService';
import {
  CandidateSort,
  displayName,
  ICandidateBreakdown,
  ICandidateFilters,
  ICandidatePoolRow,
  ICandidateRow,
  scoreCandidate,
  sortCandidates,
} from '../ranking/candidateRankingService';

/**
 * Candidate search & ranking (Phase 1 algorithm).
 *
 * The talent pool loads every PUBLIC profile once (4 batch queries, no matter
 * how many candidates), applies the recruiter's hard filters (text, skills,
 * city, minimum experience), then ranks the survivors with the relevance
 * score defined in `ranking/candidateRankingService`.
 *
 * Ranking is deterministic: score first, profile recency as the tiebreak.
 */

export type { CandidateSort, ICandidateFilters, ICandidateRow, ICandidateBreakdown };

/** Load all public candidates with skills/experience/education in 4 queries. */
const loadCandidatePool = async (): Promise<ICandidatePoolRow[]> => {
  const profiles = await jobseekerProfileRepository.listPublicWithUser();
  if (profiles.length === 0) return [];

  const userIds = profiles.map((profile) => profile.user_id);
  const profileIds = profiles.map((profile) => profile.id);
  const [skillMap, experiences, educations] = await Promise.all([
    jobseekerProfileSkillRepository.mapByUserIds(userIds),
    workExperienceRepository.listByJobseekerIds(profileIds),
    educationRepository.listByJobseekerIds(profileIds),
  ]);

  const experiencesByProfile = new Map<string, IWorkExperience[]>();
  for (const entry of experiences) {
    const list = experiencesByProfile.get(entry.jobseeker_id) ?? [];
    list.push(entry);
    experiencesByProfile.set(entry.jobseeker_id, list);
  }
  const educationsByProfile = new Map<string, IEducation[]>();
  for (const entry of educations) {
    const list = educationsByProfile.get(entry.jobseeker_id) ?? [];
    list.push(entry);
    educationsByProfile.set(entry.jobseeker_id, list);
  }

  return profiles.map((profile) => ({
    profile,
    skills: skillMap.get(profile.user_id) ?? [],
    years: yearsOfExperience(experiencesByProfile.get(profile.id) ?? []),
    educationLevel: highestEducationLevel(educationsByProfile.get(profile.id) ?? []),
  }));
};

const normalise = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

/** Hard filters — non-matches are excluded entirely (not just down-ranked). */
const passesFilters = (candidate: ICandidatePoolRow, filters: ICandidateFilters): boolean => {
  if (filters.location && normalise(candidate.profile.city) !== normalise(filters.location)) {
    return false;
  }

  if (filters.min_experience !== undefined && candidate.years < filters.min_experience) {
    return false;
  }

  if (filters.skills && filters.skills.length > 0) {
    const owned = new Set(candidate.skills.map((skill) => skill.name.toLowerCase()));
    const allPresent = filters.skills.every((skill) => owned.has(skill.trim().toLowerCase()));
    if (!allPresent) return false;
  }

  if (filters.q) {
    const haystack = [
      displayName(candidate.profile.user).name,
      candidate.profile.headline ?? '',
      candidate.profile.professional_summary ?? '',
      candidate.skills.map((skill) => skill.name).join(' '),
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(filters.q.trim().toLowerCase())) return false;
  }

  return true;
};

/** Assemble the public shape of one ranked candidate. */
const toCandidateRow = (
  candidate: ICandidatePoolRow,
  filters: ICandidateFilters,
): ICandidateRow => {
  const { score, breakdown, matched_skills } = scoreCandidate(candidate, filters);
  const { name, email } = displayName(candidate.profile.user);
  return {
    user_id: candidate.profile.user_id,
    name,
    email,
    headline: candidate.profile.headline,
    city: candidate.profile.city,
    profile_photo_url: candidate.profile.profile_photo_url,
    years_experience: candidate.years,
    skills: candidate.skills.map((skill) => skill.name),
    matched_skills,
    education_level: candidate.educationLevel,
    relevance_score: score,
    breakdown,
    profile_updated_at: candidate.profile.updated_at ?? null,
  };
};

/**
 * GET /companies/:companyId/candidates — searchable, ranked talent pool.
 * Company membership is asserted first, then the pool is filtered/sorted.
 */
export const searchCandidates = async (
  user: IAuthUser,
  companyId: string,
  filters: ICandidateFilters,
  query: IPaginationQuery,
) => {
  await assertCanManageJobs(user, companyId);
  const pagination = getPaginationParams(query);

  const pool = await loadCandidatePool();
  const ranked = sortCandidates(
    pool
      .filter((candidate) => passesFilters(candidate, filters))
      .map((candidate) => toCandidateRow(candidate, filters)),
    filters.sort,
  );

  const sort: CandidateSort = filters.sort ?? 'relevance';
  const sliced = ranked.slice(pagination.offset, pagination.offset + pagination.limit);
  return {
    data: sliced,
    meta: {
      ...buildPaginationMeta(ranked.length, pagination.page, pagination.perPage),
      sort,
    },
  };
};

export const candidateRecommendationService = { searchCandidates };

export default candidateRecommendationService;
