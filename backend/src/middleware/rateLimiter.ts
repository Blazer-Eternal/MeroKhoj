import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config';

/**
 * Rate limiters.
 *
 * A generous global limiter protects the whole API, and tighter per-route
 * limiters guard expensive or abuse-prone endpoints (auth, job application).
 */

/** Applied to every /api request. */
export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true, // draft-6 `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
  },
});

/** Stricter limiter for authentication endpoints (login/register). */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
});

/** Limiter for job application submissions. */
export const applicationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many applications submitted, please try again later.',
    },
  },
});

export default globalLimiter;
