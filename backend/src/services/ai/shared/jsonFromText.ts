import { aiResponseError } from './aiConfig';

/**
 * Tolerant JSON extraction from LLM replies.
 *
 * Models wrap JSON in prose or ```json fences and occasionally trailing
 * commas; this pulls the outermost object/array span out, repairs the common
 * slip, and otherwise fails with a clean 502 instead of a parser stack trace.
 */
export const parseJsonFromText = <T>(raw: string): T => {
  const text = raw.replace(/```(?:json)?/gi, '').trim();

  const start = text.search(/[[{]/);
  if (start === -1) throw aiResponseError('AI response contained no JSON');

  const opener = text[start];
  const closer = opener === '{' ? '}' : ']';
  const end = text.lastIndexOf(closer);
  if (end <= start) throw aiResponseError('AI response contained no readable JSON');

  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    try {
      // Most common model slip: a trailing comma before } or ].
      return JSON.parse(candidate.replace(/,(\s*[}\]])/g, '$1')) as T;
    } catch {
      throw aiResponseError('AI returned malformed JSON', {
        preview: candidate.slice(0, 200),
      });
    }
  }
};

export default parseJsonFromText;
