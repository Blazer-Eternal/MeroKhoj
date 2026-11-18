import { env } from '../../../config';
import { aiProviderError, aiResponseError, requireAI } from './aiConfig';
import { parseJsonFromText } from './jsonFromText';

/**
 * Minimal OpenAI-compatible client (Phase 2).
 *
 * Plain `fetch` against `${OPENAI_BASE_URL}/chat/completions` and
 * `/embeddings` — no SDK dependency, so request shape, timeouts and error
 * mapping stay under our control. Every failure surfaces as an AppError the
 * central handler renders as 502 with a safe message.
 */

interface IChatInput {
  system?: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

/** POST a JSON payload at the provider; returns the parsed body. */
const request = async (path: string, payload: unknown): Promise<unknown> => {
  const key = requireAI();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch(`${env.ai.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok) {
      const error = body?.error as { message?: string } | undefined;
      throw aiProviderError(
        `AI provider request failed (${response.status})${error?.message ? `: ${error.message}` : ''}`,
        { status: response.status },
      );
    }
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw aiProviderError(`AI provider timed out after ${env.ai.timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

/** One chat completion as plain text. */
export const chatText = async (input: IChatInput): Promise<string> => {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (input.system) messages.push({ role: 'system', content: input.system });
  messages.push({ role: 'user', content: input.user });

  const body = (await request('/chat/completions', {
    model: env.ai.chatModel,
    messages,
    temperature: input.temperature ?? 0.4,
    max_tokens: input.maxTokens ?? env.ai.maxTokens,
  })) as { choices?: Array<{ message?: { content?: string } }> };

  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw aiResponseError('AI provider returned an empty completion');
  }
  return content.trim();
};

/** One chat completion parsed as JSON (prose/fences tolerated). */
export const chatJSON = async <T>(input: IChatInput): Promise<T> =>
  parseJsonFromText<T>(await chatText(input));

/** Embed a batch of texts (chunked to the provider's batch limit). */
export const embed = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) return [];

  const CHUNK_SIZE = 100;
  const vectors: number[][] = [];
  for (let index = 0; index < texts.length; index += CHUNK_SIZE) {
    const chunk = texts.slice(index, index + CHUNK_SIZE);
    const body = (await request('/embeddings', {
      model: env.ai.embeddingModel,
      input: chunk,
    })) as { data?: Array<{ index: number; embedding: number[] }> };

    const ordered = [...(body.data ?? [])].sort((a, b) => a.index - b.index);
    if (ordered.length !== chunk.length || ordered.some((row) => !Array.isArray(row.embedding))) {
      throw aiResponseError('AI provider returned an incomplete embeddings batch');
    }
    vectors.push(...ordered.map((row) => row.embedding));
  }
  return vectors;
};

export const openaiClient = { chatText, chatJSON, embed };

export default openaiClient;
