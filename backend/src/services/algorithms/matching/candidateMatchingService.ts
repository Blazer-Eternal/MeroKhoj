import { IJob, IJobSkill } from '../../../interfaces';
import {
  calculateMatchScore,
  ICandidateSignals,
  IMatchResult,
} from './jobMatchingService';

/**
 * Candidate ↔ job matching, job side (Phase 1 algorithm).
 *
 * `jobMatchingService` owns the pure scorer and the candidate loaders; this
 * module owns the "given this candidate, how do these jobs rank?" direction —
 * the shape the smart-alert matcher and the candidate's own job feed need.
 */

export interface IJobMatch {
  job: IJob;
  score: number;
  result: IMatchResult;
}

/**
 * Score one job for one candidate. Thin, named wrapper around the shared
 * scorer so call sites read as intent rather than as an algorithm detail.
 */
export const matchJobToCandidate = (
  job: IJob,
  jobSkills: Array<IJobSkill & { skill?: { name: string } }>,
  candidate: ICandidateSignals,
): IMatchResult => calculateMatchScore(job, jobSkills, candidate);

/**
 * Score + rank many jobs for one candidate (pure).
 * Ties break on recency: newer postings first.
 */
export const scoreJobsForCandidate = (
  jobs: IJob[],
  jobSkillsByJob: Map<string, Array<IJobSkill & { skill?: { name: string } }>>,
  candidate: ICandidateSignals,
): IJobMatch[] => {
  const matches = jobs.map((job) => ({
    job,
    score: 0,
    result: calculateMatchScore(job, jobSkillsByJob.get(job.id) ?? [], candidate),
  }));

  for (const match of matches) match.score = match.result.score;

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.job.published_at ? new Date(a.job.published_at).getTime() : 0;
    const bTime = b.job.published_at ? new Date(b.job.published_at).getTime() : 0;
    return bTime - aTime;
  });

  return matches;
};

/** Minimum score for a profile-fit (filter-less) screen to accept a job. */
export const PROFILE_FIT_THRESHOLD = 40;

export const candidateMatchingService = {
  matchJobToCandidate,
  scoreJobsForCandidate,
  PROFILE_FIT_THRESHOLD,
};

export default candidateMatchingService;
