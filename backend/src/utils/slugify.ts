/**
 * Convert an arbitrary string into a URL-safe slug.
 *
 * Examples:
 *   "Senior Backend Engineer"  -> "senior-backend-engineer"
 *   "Node.js & React Dev"     -> "node-js-react-dev"
 *   "  Multiple   spaces  "   -> "multiple-spaces"
 */
export const slugify = (input: string): string =>
  input
    .toString()
    .normalize('NFKD') // decompose accents (é -> e + ́)
    .replace(/[̀-ͯ]/g, '') // strip combining marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, 200); // guard against unbounded length

/**
 * Ensure a slug is unique against a uniqueness checker by appending -1, -2, ...
 *
 * @param base   The desired slug (already slugified).
 * @param exists Async predicate returning true when the slug is taken.
 * @param maxAttempts How many suffixes to try before giving up.
 */
export const ensureUniqueSlug = async (
  base: string,
  exists: (slug: string) => Promise<boolean>,
  maxAttempts = 50,
): Promise<string> => {
  if (!(await exists(base))) return base;

  for (let i = 1; i <= maxAttempts; i += 1) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Extremely unlikely; fall back to a time-based suffix.
  return `${base}-${Date.now().toString(36)}`;
};
