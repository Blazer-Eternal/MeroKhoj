import { env } from '../../../config';
import { IJob } from '../../../interfaces';
import { jobEmbeddingRepository, jobRepository, jobSkillRepository } from '../../../repositories';
import { isAIConfigured } from '../shared/aiConfig';
import { embed } from '../shared/openaiClient';
import { buildJobSearchText } from './semanticSearchService';

/**
 * Job embedding lifecycle (Phase 2, semantic search).
 *
 * Embeddings are refreshed:
 *   - on job create / update / first publish (fire-and-forget hook from
 *     jobServices — failures are logged, never block the employer);
 *   - on demand by `npm run embed:jobs` (backfill after adding the key).
 *
 * With no OPENAI_API_KEY everything here is a no-op so the platform runs
 * exactly as before; semantic search then serves KEYWORD mode.
 */

/** Embed one job's search text and upsert it. No-op without an API key. */
export const embedJob = async (job: IJob): Promise<boolean> => {
  if (!isAIConfigured()) return false;

  try {
    const skills = await jobSkillRepository.listByJob(job.id);
    const text = buildJobSearchText(
      job,
      skills.map((entry) => entry.skill?.name ?? '').filter(Boolean),
    );
    const [vector] = await embed([text]);
    if (!vector) return false;

    await jobEmbeddingRepository.upsert(
      job.id,
      vector,
      env.ai.embeddingModel,
      vector.length,
    );
    return true;
  } catch (error) {
    // Never fail the employer's request over an embedding hiccup.
    console.error(`[ai-embed] failed for job ${job.id}:`, error);
    return false;
  }
};

/**
 * Fire-and-forget wrapper for service hooks: swallows every error so
 * create/update/publish responses are unaffected.
 */
export const scheduleJobEmbed = (job: IJob): void => {
  if (!isAIConfigured()) return;
  void embedJob(job);
};

/** Embed every published job (backfill). Returns successes/total. */
export const embedPublishedJobs = async (): Promise<{ embedded: number; total: number }> => {
  const published = await jobRepository.findPublishedMatching({});
  let embedded = 0;
  for (const job of published) {
    const ok = await embedJob(job);
    if (ok) embedded += 1;
  }
  return { embedded, total: published.length };
};

export const jobEmbeddingService = { embedJob, scheduleJobEmbed, embedPublishedJobs };

export default jobEmbeddingService;
