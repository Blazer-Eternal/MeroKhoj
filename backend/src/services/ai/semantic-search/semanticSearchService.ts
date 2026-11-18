import {
  ISearchIntent,
  ISemanticMatch,
  ISemanticSearchResult,
  SemanticSearchMode,
} from '../../../interfaces';
import { IJob } from '../../../interfaces';
import { jobRepository, jobSkillRepository, jobEmbeddingRepository } from '../../../repositories';
import { isAIConfigured } from '../shared/aiConfig';
import { embed } from '../shared/openaiClient';
import { cosineSimilarity, normalizeSimilarity } from './cosine';
import { parseSearchIntent } from './intentParser';

/**
 * AI semantic job search (Phase 2, feature 7).
 *
 * Two modes, chosen automatically:
 *   - SEMANTIC (OPENAI_API_KEY set): the query is embedded and ranked
 *     against stored job embeddings by cosine similarity, stretched to 0-100.
 *   - KEYWORD (no key, or no embeddings yet): deterministic token-overlap
 *     ranking so search always works — degraded, never broken.
 *
 * Hard filters read from the query (employment type, recency, salary floor,
 * remote) are applied before ranking in both modes. Every match carries a
 * `why` line: matched keywords plus a similarity note.
 */

const KEYWORD_SCORE_FLOOR = 5;

/** Build the text that gets embedded for one job (title + facts + skills). */
export const buildJobSearchText = (
  job: IJob,
  skillNames: string[] = [],
): string =>
  [
    job.title,
    job.description?.slice(0, 1500) ?? '',
    skillNames.join(', '),
    job.location ?? '',
    job.employment_type ?? '',
    job.experience_level ?? '',
    job.education_requirement ?? '',
    job.experience_requirement ?? '',
  ]
    .filter(Boolean)
    .join('\n');

/** Apply intent hard filters to a candidate job. */
const passesFilters = (job: IJob, intent: ISearchIntent, now: Date): boolean => {
  if (intent.employment_type && job.employment_type !== intent.employment_type) return false;

  if (intent.remote_only) {
    const haystack = `${job.location ?? ''} ${job.description ?? ''}`.toLowerCase();
    if (!/\bremote\b|\bwork from home\b|\bwfh\b/.test(haystack)) return false;
  }

  if (intent.posted_within_days !== null) {
    const reference = job.published_at ?? job.created_at;
    if (reference) {
      const ageMs = now.getTime() - new Date(reference).getTime();
      if (ageMs > intent.posted_within_days * 86_400_000) return false;
    }
  }

  if (intent.salary_min !== null) {
    // A salary floor matches jobs whose top end can reach it, or unsalaried
    // postings (no range published) so we never hide them by accident.
    if (job.salary_max !== null && job.salary_max < intent.salary_min) return false;
  }

  return true;
};

/** Token overlap between intent keywords and job text (0-1). */
export const keywordOverlap = (keywords: string[], haystack: string): number => {
  if (keywords.length === 0) return 0;
  const text = haystack.toLowerCase();
  const matched = keywords.filter((keyword) => text.includes(keyword));
  return matched.length / keywords.length;
};

/** Compose the user-facing justification for a match. */
const buildWhy = (
  keywords: string[],
  haystack: string,
  mode: SemanticSearchMode,
  similarity: number,
): string => {
  const matched = keywords.filter((keyword) => haystack.toLowerCase().includes(keyword));
  const parts: string[] = [];

  if (matched.length > 0) {
    parts.push(`Matches your search for ${matched.slice(0, 5).join(', ')}`);
  }
  if (mode === 'SEMANTIC' && similarity >= 0.3) {
    parts.push('strongly related to what you described');
  } else if (mode === 'KEYWORD' && matched.length === 0) {
    parts.push('recent posting in your area of interest');
  }
  if (parts.length === 0) {
    parts.push(mode === 'SEMANTIC' ? 'related to your search' : 'keyword match');
  }
  return `${parts.join(' — ')}.`;
};

export interface ISemanticSearchInput {
  query: string;
  limit?: number;
}

/** Rank published jobs against a natural-language query. */
export const searchJobsSemantic = async (
  input: ISemanticSearchInput,
): Promise<ISemanticSearchResult> => {
  const intent = parseSearchIntent(input.query);
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const now = new Date();

  // Candidate pool: all published jobs, then hard filters.
  const published = await jobRepository.findPublishedMatching({});
  const candidates = published.filter((job) => passesFilters(job, intent, now));

  if (candidates.length === 0) {
    return { mode: isAIConfigured() ? 'SEMANTIC' : 'KEYWORD', intent, matches: [] };
  }

  // Skill names per job (for embedding text + keyword haystacks).
  const skillMap = await jobSkillRepository.mapByJobIds(candidates.map((job) => job.id));
  const haystacks = new Map<string, string>();
  for (const job of candidates) {
    const names = (skillMap.get(job.id) ?? []).map((entry) => entry.skill?.name ?? '');
    haystacks.set(job.id, buildJobSearchText(job, names));
  }

  const useSemantic = isAIConfigured();
  const mode: SemanticSearchMode = useSemantic ? 'SEMANTIC' : 'KEYWORD';

  let scores: Map<string, number>;
  if (useSemantic) {
    const [queryVectorRows, stored] = await Promise.all([
      embed([input.query]),
      jobEmbeddingRepository.mapByJobIds(candidates.map((job) => job.id)),
    ]);
    const queryVector = queryVectorRows[0];

    scores = new Map();
    for (const job of candidates) {
      const jobVector = stored.get(job.id);
      if (jobVector && jobVector.length === queryVector.length) {
        scores.set(job.id, normalizeSimilarity(cosineSimilarity(queryVector, jobVector)));
      } else {
        // No embedding yet (or dimension drift): keyword fallback for this row.
        scores.set(
          job.id,
          Math.round(keywordOverlap(intent.keywords, haystacks.get(job.id) ?? '') * 70),
        );
      }
    }
  } else {
    scores = new Map();
    for (const job of candidates) {
      const overlap = keywordOverlap(intent.keywords, haystacks.get(job.id) ?? '');
      scores.set(job.id, Math.round(overlap * 100));
    }
  }

  const matches: ISemanticMatch[] = candidates
    .map((job) => ({
      job_id: job.id,
      match_score: scores.get(job.id) ?? 0,
      why: buildWhy(
        intent.keywords,
        haystacks.get(job.id) ?? '',
        mode,
        // Reuse the overlap as a similarity proxy for the why-text threshold.
        (scores.get(job.id) ?? 0) / 100,
      ),
    }))
    .filter((match) => match.match_score >= KEYWORD_SCORE_FLOOR)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return { mode, intent, matches };
};

export const semanticSearchService = { searchJobsSemantic, parseSearchIntent, buildJobSearchText };

export default semanticSearchService;
