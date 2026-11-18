import { IJobseekerProfile } from '../../../interfaces';
import { keywords } from '../matching/jobMatchingService';

/**
 * Candidate ranking (Phase 1 algorithm).
 *
 * Ranks a filtered talent pool with a 0-100 relevance score:
 *
 *   skills     40  requested skills possessed (or, with no skill filter,
 *                  a richer skill set ranks higher)
 *   keywords   25  free-text hits on name/headline/summary/skills (or, with
 *                  no query, whether the headline is filled in)
 *   location   15  requested city matched (or profile has a city at all)
 *   experience 20  meets the requested minimum years (or more years rank up)
 *
 * The score is pure — the pool itself is loaded and filtered by
 * `candidateRecommendationService`.
 */

export type CandidateSort = 'relevance' | 'experience' | 'recent';

export interface ICandidateFilters {
  q?: string;
  skills?: string[];
  location?: string;
  min_experience?: number;
  sort?: CandidateSort;
}

export interface ICandidateBreakdown {
  skills: number;
  keywords: number;
  location: number;
  experience: number;
}

export interface ICandidateRow {
  user_id: string;
  name: string;
  email: string;
  headline: string | null;
  city: string | null;
  profile_photo_url: string | null;
  years_experience: number;
  skills: string[];
  matched_skills: string[];
  education_level: number | null;
  relevance_score: number;
  breakdown: ICandidateBreakdown;
  profile_updated_at: Date | null;
}

/** One public candidate with everything the ranker needs. */
export interface ICandidatePoolRow {
  profile: IJobseekerProfile & { user?: unknown };
  skills: Array<{ id: string; name: string }>;
  years: number;
  educationLevel: number | null;
}

/** "First Last" (falling back to the email) from an included user row. */
export const displayName = (user: unknown): { name: string; email: string } => {
  const row = user as { first_name?: string; last_name?: string; email?: string } | undefined;
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim();
  return { name: name || row?.email || 'Unknown candidate', email: row?.email ?? '' };
};

const normalise = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

/** The candidate's searchable text, lowercased once per call. */
const haystackOf = (candidate: ICandidatePoolRow): string =>
  [
    displayName(candidate.profile.user).name,
    candidate.profile.headline ?? '',
    candidate.profile.professional_summary ?? '',
    candidate.skills.map((skill) => skill.name).join(' '),
  ]
    .join(' ')
    .toLowerCase();

/** Relevance score for one candidate against the recruiter's criteria (pure). */
export const scoreCandidate = (
  candidate: ICandidatePoolRow,
  filters: ICandidateFilters,
): { score: number; breakdown: ICandidateBreakdown; matched_skills: string[] } => {
  const requested = (filters.skills ?? []).map((skill) => skill.trim().toLowerCase());
  const owned = candidate.skills.map((skill) => skill.name.toLowerCase());
  const matchedSkills = requested.filter((skill) => owned.includes(skill));

  // skills (40)
  const skillsScore =
    requested.length > 0
      ? Math.round((40 * matchedSkills.length) / requested.length)
      : Math.min(40, candidate.skills.length * 8);

  // keywords (25)
  const haystack = haystackOf(candidate);
  const query = normalise(filters.q);
  let keywordScore: number;
  if (query) {
    const queryWords = query.split(/\s+/).filter(Boolean);
    const hits = queryWords.filter((word) => haystack.includes(word)).length;
    // Longer tokens that survive the stopword tokenizer count as evidence too.
    const richHits = keywords(filters.q).filter((word) => haystack.includes(word)).length;
    const best = Math.max(hits, richHits);
    keywordScore = best >= 2 ? 25 : best === 1 ? 12 : 0;
  } else {
    keywordScore = candidate.profile.headline ? 15 : 0;
  }

  // location (15)
  const locationScore = filters.location
    ? normalise(candidate.profile.city) === normalise(filters.location)
      ? 15
      : 0
    : candidate.profile.city
      ? 15
      : 0;

  // experience (20)
  const minExperience = filters.min_experience ?? 0;
  const experienceScore =
    minExperience > 0
      ? candidate.years >= minExperience
        ? 20
        : Math.max(0, Math.round((20 * candidate.years) / minExperience))
      : Math.min(20, Math.round(candidate.years * 4));

  const breakdown: ICandidateBreakdown = {
    skills: skillsScore,
    keywords: keywordScore,
    location: locationScore,
    experience: experienceScore,
  };

  return {
    score: Math.max(0, Math.min(100, skillsScore + keywordScore + locationScore + experienceScore)),
    breakdown,
    matched_skills: matchedSkills,
  };
};

/**
 * Order scored candidates by the requested sort key.
 * Relevance is the default and always the final tiebreak (then recency).
 */
export const sortCandidates = (
  rows: ICandidateRow[],
  sort: CandidateSort = 'relevance',
): ICandidateRow[] => {
  const updatedTime = (row: ICandidateRow): number =>
    row.profile_updated_at ? new Date(row.profile_updated_at).getTime() : 0;

  return [...rows].sort((a, b) => {
    if (sort === 'experience' && b.years_experience !== a.years_experience) {
      return b.years_experience - a.years_experience;
    }
    if (sort === 'recent' && updatedTime(a) !== updatedTime(b)) {
      return updatedTime(b) - updatedTime(a);
    }
    if (b.relevance_score !== a.relevance_score) return b.relevance_score - a.relevance_score;
    return updatedTime(b) - updatedTime(a);
  });
};

export const candidateRankingService = {
  displayName,
  scoreCandidate,
  sortCandidates,
};

export default candidateRankingService;
