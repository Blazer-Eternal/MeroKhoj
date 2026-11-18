import { env } from '../../../config';
import { AppError } from '../../../utils';

/**
 * AI configuration guards (Phase 2).
 *
 * Every generative endpoint calls `requireAI()` first so a server without
 * OPENAI_API_KEY answers with an explicit 503/AI_NOT_CONFIGURED instead of a
 * confusing 500. Features that can degrade gracefully (semantic search,
 * skill-gap suggestions) check `isAIConfigured()` and pick a fallback mode.
 */

/** True when an OpenAI-compatible API key is configured. */
export const isAIConfigured = (): boolean => env.ai.apiKey.length > 0;

/** 503 thrown while no key is configured. */
export const aiUnavailable = (): AppError =>
  new AppError(
    'AI features are not configured on this server (set OPENAI_API_KEY)',
    503,
    'AI_NOT_CONFIGURED',
    true,
  );

/** Return the API key or throw 503 — call at the top of generative methods. */
export const requireAI = (): string => {
  if (!isAIConfigured()) throw aiUnavailable();
  return env.ai.apiKey;
};

/** Upstream provider failure: non-2xx, timeout or network error. */
export const aiProviderError = (message: string, details?: unknown): AppError =>
  new AppError(message, 502, 'AI_PROVIDER_ERROR', true, details);

/** Provider answered but the payload could not be used. */
export const aiResponseError = (message: string, details?: unknown): AppError =>
  new AppError(message, 502, 'AI_INVALID_RESPONSE', true, details);

export const aiConfig = {
  isAIConfigured,
  aiUnavailable,
  requireAI,
  aiProviderError,
  aiResponseError,
};

export default aiConfig;
