import { getSequelize } from '../config';
import { initializeModels } from '../models';
import { embedPublishedJobs } from '../services/ai/semantic-search/jobEmbeddingService';
import { isAIConfigured } from '../services/ai/shared/aiConfig';

/**
 * Backfill semantic-search embeddings for every published job.
 * Usage: `npm run embed:jobs`
 * Safe to re-run (upsert). No-op with a warning when OPENAI_API_KEY is unset.
 */
const main = async (): Promise<void> => {
  if (!isAIConfigured()) {
    console.log('[embed:jobs] OPENAI_API_KEY not set — nothing to embed.');
    console.log('[embed:jobs] Add OPENAI_API_KEY to .env.local and re-run.');
    process.exit(0);
  }

  initializeModels(getSequelize());
  const { embedded, total } = await embedPublishedJobs();
  console.log(`[embed:jobs] embedded ${embedded}/${total} published jobs.`);
  process.exit(embedded === total ? 0 : 1);
};

main().catch((error) => {
  console.error('[embed:jobs] failed:', error);
  process.exit(1);
});
