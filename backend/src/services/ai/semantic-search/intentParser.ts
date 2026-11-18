import { ISearchIntent } from '../../../interfaces';

/**
 * Natural-language search intent parser (Phase 2, feature 7).
 *
 * Pure and deterministic: no LLM. Recognises the filter phrases a jobseeker
 * naturally types ("remote", "over 180k", "full time", "last 3 days",
 * "senior/junior") and strips them out, leaving semantic keywords for
 * ranking. Exported for unit tests.
 */

const EMPLOYMENT_PHRASES: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(full[\s-]?time|fulltime)\b/i, value: 'FULL_TIME' },
  { pattern: /\b(part[\s-]?time|parttime)\b/i, value: 'PART_TIME' },
  { pattern: /\b(contract|contractual|freelance)\b/i, value: 'CONTRACT' },
  { pattern: /\b(internship|intern)\b/i, value: 'INTERNSHIP' },
  { pattern: /\b(temporary|temp)\b/i, value: 'TEMPORARY' },
];

const LEVEL_PHRASES: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(junior|entry[\s-]?level|beginner|fresher)\b/i, value: 'ENTRY' },
  { pattern: /\b(mid[\s-]?level|intermediate)\b/i, value: 'MID' },
  { pattern: /\b(senior|sr\.?|experienced)\b/i, value: 'SENIOR' },
  { pattern: /\b(lead|principal|staff)\b/i, value: 'LEAD' },
  { pattern: /\b(head of|director|vp|cto|executive|chief)\b/i, value: 'EXECUTIVE' },
];

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'these', 'those', 'your', 'you',
  'are', 'our', 'will', 'can', 'has', 'have', 'had', 'was', 'were', 'been',
  'from', 'into', 'their', 'they', 'them', 'who', 'what', 'when', 'where',
  'work', 'team', 'role', 'jobs', 'job', 'join', 'about', 'over', 'under',
  'more', 'most', 'some', 'such', 'than', 'then', 'also', 'able', 'must',
  'want', 'looking', 'find', 'need', 'please', 'any', 'like', 'get', 'well',
  'years', 'year', 'experience', 'position', 'opportunity', 'available',
]);

/** Extract "last N days" / "past week" recency filters. */
const parseRecency = (query: string): number | null => {
  const days = query.match(/\b(?:last|past|within)\s+(\d{1,3})\s+days?\b/i);
  if (days) return Number(days[1]);
  if (/\b(?:last|past)\s+week\b/i.test(query)) return 7;
  if (/\b(?:last|past)\s+month\b/i.test(query)) return 30;
  if (/\b(?:today|last\s+24\s+hours)\b/i.test(query)) return 1;
  return null;
};

/**
 * Extract salary floor: "over 180k", "180000+", "above 1.8 lakh" (k-only;
 * lakh/crore are out of scope for the demo corpus).
 */
const parseSalaryFloor = (query: string): number | null => {
  const kMatch = query.match(
    /\b(?:over|above|at\s+least|min(?:imum)?|earning)\s+(\d{2,4}(?:\.\d+)?)\s*k\b|\b(\d{2,4}(?:\.\d+)?)\s*k\+\b/i,
  );
  if (kMatch) {
    const value = Number(kMatch[1] ?? kMatch[2]);
    if (Number.isFinite(value)) return Math.round(value * 1000);
  }
  const plain = query.match(
    /\b(?:over|above|at\s+least|min(?:imum)?)\s+(\d{6,7})\b/i,
  );
  if (plain) {
    const value = Number(plain[1]);
    if (Number.isFinite(value)) return value;
  }
  return null;
};

/** Remove a matched phrase from the query so it does not leak into keywords. */
const stripPhrase = (query: string, pattern: RegExp): string =>
  query.replace(pattern, ' ');

/**
 * Parse a natural-language query into filters + leftover keywords.
 * Order matters: numeric filters are stripped before generic words.
 */
export const parseSearchIntent = (rawQuery: string): ISearchIntent => {
  let query = rawQuery.replace(/\s+/g, ' ').trim();
  if (!query) {
    return {
      keywords: [],
      employment_type: null,
      experience_level: null,
      salary_min: null,
      remote_only: false,
      posted_within_days: null,
    };
  }

  const remote_only = /\bremote(?:[\s-]?first|[\s-]?only)?\b|\bwork\s+from\s+home\b|\bwfh\b/i.test(
    query,
  );
  if (remote_only) {
    query = stripPhrase(query, /\bremote(?:[\s-]?first|[\s-]?only)?\b|\bwork\s+from\s+home\b|\bwfh\b/i);
  }

  const posted_within_days = parseRecency(query);
  if (posted_within_days !== null) {
    query = stripPhrase(
      query,
      /\b(?:last|past|within)\s+\d{1,3}\s+days?\b|\b(?:last|past)\s+(?:week|month)\b|\b(?:today|last\s+24\s+hours)\b/i,
    );
  }

  const salary_min = parseSalaryFloor(query);
  if (salary_min !== null) {
    query = stripPhrase(
      query,
      /\b(?:over|above|at\s+least|min(?:imum)?|earning)\s+\d{2,4}(?:\.\d+)?\s*k\b|\b\d{2,4}(?:\.\d+)?\s*k\+\b|\b(?:over|above|at\s+least|min(?:imum)?)\s+\d{6,7}\b/i,
    );
  }

  let employment_type: string | null = null;
  for (const { pattern, value } of EMPLOYMENT_PHRASES) {
    if (pattern.test(query)) {
      employment_type = value;
      query = stripPhrase(query, pattern);
      break;
    }
  }

  let experience_level: string | null = null;
  for (const { pattern, value } of LEVEL_PHRASES) {
    if (pattern.test(query)) {
      experience_level = value;
      query = stripPhrase(query, pattern);
      break;
    }
  }

  const keywords = query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));

  return {
    keywords,
    employment_type,
    experience_level,
    salary_min,
    remote_only,
    posted_within_days,
  };
};

export default parseSearchIntent;
