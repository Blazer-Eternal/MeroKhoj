import { IEducation, IJob, IJobseekerProfile, IWorkExperience } from '../../../interfaces';
import { keywords } from '../matching/jobMatchingService';

/**
 * Job ranking (Phase 1 algorithm).
 *
 * How well an individual posting fits a candidate's profile, expressed as a
 * small additive score used to order the "recommended jobs" feed:
 *
 *   +4 per skill overlap with the posting (cap 12)
 *   +3 when the job's city matches the profile city
 *   +2 per headline/summary keyword appearing in the title (cap 6)
 *   +1 when the posting's category matches the candidate's background
 *
 * Everything here is pure: signals are built once per candidate, then every
 * job is scored against them with no I/O.
 */

export interface IProfileSignals {
  skill_names: Set<string>;
  headline_keywords: Set<string>;
  summary_keywords: Set<string>;
  city: string;
  background: string;
}

/** A job as the ranker consumes it (association data optional). */
export type IRankableJob = IJob & {
  category?: { name?: string } | null;
  skills?: Array<{ id: string; name: string }>;
};

export type ScoredJob = IRankableJob & { score: number };

/** Derive every ranking signal from a candidate's profile in one pass. */
export const buildProfileSignals = (
  profile: IJobseekerProfile,
  skills: Array<{ name: string }>,
  educations: IEducation[],
  experiences: IWorkExperience[],
): IProfileSignals => ({
  skill_names: new Set(skills.map((skill) => skill.name.toLowerCase())),
  headline_keywords: new Set(keywords(profile.headline)),
  summary_keywords: new Set(keywords(profile.professional_summary)),
  city: (profile.city ?? '').trim().toLowerCase(),
  background: [
    ...educations.map((entry) => `${entry.degree} ${entry.field_of_study ?? ''}`),
    ...experiences.map((entry) => entry.job_title),
  ]
    .join(' ')
    .toLowerCase(),
});

/** Score a single job against prepared profile signals (pure). */
export const scoreJobAgainstSignals = (job: IRankableJob, signals: IProfileSignals): number => {
  let score = 0;

  // Skill overlap: +4 each, capped at 12.
  const jobSkillNames = (job.skills ?? []).map((skill) => skill.name.toLowerCase());
  const overlaps = jobSkillNames.filter((name) => signals.skill_names.has(name)).length;
  score += Math.min(overlaps * 4, 12);

  // Same city: +3.
  const jobCity = (job.location ?? '').trim().toLowerCase();
  if (signals.city && jobCity && signals.city === jobCity) score += 3;

  // Headline/summary keywords appearing in the title: +2 each, capped at 6.
  const titleWords = new Set(keywords(job.title));
  const keywordHits =
    [...signals.headline_keywords].filter((word) => titleWords.has(word)).length +
    [...signals.summary_keywords].filter((word) => titleWords.has(word)).length;
  score += Math.min(keywordHits * 2, 6);

  // Category matches the candidate's education or experience: +1.
  const categoryName = (job.category?.name ?? '').trim().toLowerCase();
  if (categoryName && categoryName.length >= 4 && signals.background.includes(categoryName)) {
    score += 1;
  }

  return score;
};

/** Rank jobs by score, then recency. Pure; without signals, newest first. */
export const rankJobsForCandidate = (
  jobs: IRankableJob[],
  signals: IProfileSignals | null,
): ScoredJob[] => {
  if (!signals) return jobs.map((job) => ({ ...job, score: 0 }));

  const scored = jobs.map((job) => ({ ...job, score: scoreJobAgainstSignals(job, signals) }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bTime - aTime;
  });
  return scored;
};

export const jobRankingService = {
  buildProfileSignals,
  scoreJobAgainstSignals,
  rankJobsForCandidate,
};

export default jobRankingService;
