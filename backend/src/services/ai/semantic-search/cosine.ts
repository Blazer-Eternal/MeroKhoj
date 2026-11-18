/**
 * Cosine similarity helpers (Phase 2, semantic search).
 *
 * pgvector is unavailable on this deployment, so vectors live in a REAL[]
 * column and ranking happens here in pure TypeScript. Exported for unit
 * tests; the repository only stores/retrieves arrays.
 */

/** Cosine similarity in [-1, 1]; zero vectors (defensively) return 0. */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Map raw cosine into a 0-100 match score.
 * Cosines for "related but not equal" job/query pairs typically land around
 * 0.05-0.55, so we stretch that band: below 0.05 → 0, at/above 0.55 → 100.
 * This keeps scores intuitive instead of clustering everything at 10-30%.
 */
export const normalizeSimilarity = (similarity: number): number => {
  const FLOOR = 0.05;
  const CEIL = 0.55;
  const clamped = Math.min(CEIL, Math.max(FLOOR, similarity));
  return Math.round(((clamped - FLOOR) / (CEIL - FLOOR)) * 100);
};

export default { cosineSimilarity, normalizeSimilarity };
