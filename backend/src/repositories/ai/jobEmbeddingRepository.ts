import { getSequelize } from '../../config';

/**
 * Data access for `job_embeddings` (Phase 2, semantic search).
 *
 * pgvector is not available on this deployment, so embeddings live in a
 * native REAL[] column. Vectors are serialized as a Postgres array literal
 * (`'{0.1,-0.2}'`) before substitution — passing a JS array through
 * sequelize's `replacements` would expand it into a comma list and break
 * the statement. Ranking (cosine) happens in application code; upgrading to
 * a pgvector `vector(1536)` column later only touches this repository.
 */

export interface IJobEmbeddingRow {
  job_id: string;
  embedding: number[];
  model: string;
  dimensions: number;
  updated_at: Date;
}

/** Serialize a vector as a Postgres REAL[] literal. */
export const toRealArrayLiteral = (vector: number[]): string => {
  if (vector.length === 0) throw new Error('embedding vector must not be empty');
  const parts = vector.map((value) => {
    if (!Number.isFinite(value)) throw new Error('embedding vector contains a non-finite value');
    // toFixed-free: full precision round-trips through REAL.
    return String(value);
  });
  return `{${parts.join(',')}}`;
};

/** Parse a REAL[] literal (or a JS array from the pg driver) back to numbers. */
export const parseRealArray = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === 'string') {
    const inner = value.replace(/^\{|\}$/g, '');
    if (inner === '') return [];
    return inner.split(',').map(Number);
  }
  throw new Error('unexpected embedding array format');
};

class JobEmbeddingRepository {
  /** Insert or replace the embedding for one job. */
  async upsert(
    jobId: string,
    vector: number[],
    model: string,
    dimensions: number,
  ): Promise<void> {
    await getSequelize().query(
      `INSERT INTO job_embeddings (job_id, embedding, model, dimensions)
       VALUES (:jobId, :vector::real[], :model, :dimensions)
       ON CONFLICT (job_id) DO UPDATE SET
         embedding = EXCLUDED.embedding,
         model = EXCLUDED.model,
         dimensions = EXCLUDED.dimensions,
         updated_at = NOW()`,
      {
        replacements: {
          jobId,
          vector: toRealArrayLiteral(vector),
          model,
          dimensions,
        },
      },
    );
  }

  /** Embeddings for a set of jobs (one query, keyed by job id). */
  async mapByJobIds(jobIds: string[]): Promise<Map<string, number[]>> {
    const map = new Map<string, number[]>();
    if (jobIds.length === 0) return map;

    const rows = (await getSequelize().query(
      `SELECT job_id, embedding FROM job_embeddings WHERE job_id = ANY(:jobIds)`,
      { replacements: { jobIds }, type: 'SELECT' as const },
    )) as Array<{ job_id: string; embedding: unknown }>;

    for (const row of rows) map.set(row.job_id, parseRealArray(row.embedding));
    return map;
  }

  /** Every stored embedding (backfill freshness checks / full re-rank). */
  async listAll(): Promise<IJobEmbeddingRow[]> {
    const rows = (await getSequelize().query(
      `SELECT job_id, embedding, model, dimensions, updated_at
       FROM job_embeddings`,
      { type: 'SELECT' as const },
    )) as Array<{
      job_id: string;
      embedding: unknown;
      model: string;
      dimensions: number;
      updated_at: Date;
    }>;

    return rows.map((row) => ({
      job_id: row.job_id,
      embedding: parseRealArray(row.embedding),
      model: row.model,
      dimensions: row.dimensions,
      updated_at: row.updated_at,
    }));
  }

  /** Remove the embedding for a job (deleted job — CASCADE also covers it). */
  async destroy(jobId: string): Promise<void> {
    await getSequelize().query(`DELETE FROM job_embeddings WHERE job_id = :jobId`, {
      replacements: { jobId },
    });
  }
}

export default new JobEmbeddingRepository();
