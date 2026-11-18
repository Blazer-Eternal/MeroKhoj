/**
 * Tolerant coercion helpers for LLM payloads (Phase 2).
 *
 * Model output is untrusted: these turn whatever came back into the exact
 * shapes our interfaces promise, dropping malformed entries instead of
 * letting a bad array element crash a controller.
 */

/** Trimmed string or null. */
export const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/** Non-empty strings from an unknown array (order preserved, de-duped). */
export const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    const text = asString(entry);
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      out.push(text);
    }
  }
  return out;
};

/** Objects from an unknown array, filtered to records. */
export const asObjectArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is Record<string, unknown> =>
      typeof entry === 'object' && entry !== null && !Array.isArray(entry),
  );
};

/**
 * Loose date parse for resume dates: "2021-03", "2021-03-15", "2021" all
 * become Dates; "Present"/"Current"/garbage become null.
 */
export const parseLooseDate = (value: unknown): Date | null => {
  const text = asString(value);
  if (!text) return null;
  if (/^(present|current|now|ongoing)$/i.test(text)) return null;

  const yearFirst = text.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (yearFirst) {
    const year = Number(yearFirst[1]);
    const month = Number(yearFirst[2]) - 1;
    const day = yearFirst[3] ? Number(yearFirst[3]) : 1;
    const date = new Date(Date.UTC(year, month, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) {
    const date = new Date(Date.UTC(Number(yearOnly[1]), 0, 1));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Clamp a number into [min, max]; non-finite input becomes `fallback`. */
export const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};
