import { AppError } from './appError';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_V4_REGEX.test(value);

/**
 * Parse and validate a route param that must be a UUID.
 *
 * Throws a 404-style AppError when the value is malformed so callers can
 * short-circuit before touching the database.
 */
export const parseId = (value: unknown, field = 'id'): string => {
  if (typeof value !== 'string' || !isUuid(value)) {
    throw AppError.notFound(`Invalid ${field}: expected a UUID`);
  }
  return value;
};

/** Parse a UUID returning null instead of throwing (for query params). */
export const parseIdOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string' || !isUuid(value)) return null;
  return value;
};

/** Parse a positive integer, clamped to a range (for pagination etc.). */
export const parsePositiveInt = (
  value: unknown,
  fallback: number,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
): number => {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : (value as number);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};
