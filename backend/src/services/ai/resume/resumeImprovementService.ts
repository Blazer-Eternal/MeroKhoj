import { AppError } from '../../../utils';
import { IResumeSuggestion, ResumeImprovementArea } from '../../../interfaces';
import { requireAI } from '../shared/aiConfig';
import { chatJSON } from '../shared/openaiClient';
import { asObjectArray, asString, asStringArray } from '../shared/coerce';

/**
 * AI resume improvement (Phase 2, feature 2).
 *
 * Stateless: the caller sends resume text (or a single excerpt) plus which
 * areas to review; the model returns actionable suggestions shaped like the
 * CVCraft reference — each with the original excerpt, a replacement the user
 * can accept ("Use"), and a short reason.
 */

const AREAS: ResumeImprovementArea[] = ['summary', 'experience', 'skills', 'grammar', 'formatting'];

const SYSTEM_PROMPT = `You are an expert resume editor for a job board.
Review the resume text the user provides and return concrete, high-impact suggestions.
Rules:
- Respond with ONLY a JSON object, no prose, no markdown fences.
- Suggest at most 8 changes; quality over quantity.
- "original" must be an exact excerpt copied from the resume (empty string for whole-document notes).
- "suggestion" must be a drop-in replacement for "original" (or the new text for whole-document notes).
- "reason" explains the improvement in one sentence.
- Never invent employers, dates, degrees or metrics that are not in the source text.
- Soften nothing: keep the candidate's real facts and verbs.
- "area" must be one of: summary, experience, skills, grammar, formatting.
JSON shape:
{ "suggestions": [{ "area": string, "original": string, "suggestion": string, "reason": string }] }`;

const AREA_ALIASES: Record<string, ResumeImprovementArea> = {
  summary: 'summary',
  professional_summary: 'summary',
  experience: 'experience',
  work_experience: 'experience',
  skills: 'skills',
  grammar: 'grammar',
  formatting: 'formatting',
  format: 'formatting',
};

export interface IImproveResumeInput {
  text: string;
  /** Restrict the review to these areas (default: all). */
  areas?: ResumeImprovementArea[];
  /** Optional target role so wording can be tailored. */
  target_role?: string | null;
}

/** Normalise raw model output into typed suggestions. */
export const normalizeSuggestions = (raw: unknown): IResumeSuggestion[] => {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const out: IResumeSuggestion[] = [];
  const seen = new Set<string>();

  for (const entry of asObjectArray(record.suggestions)) {
    const area = AREA_ALIASES[asString(entry.area)?.toLowerCase() ?? ''] ?? 'grammar';
    const original = asString(entry.original) ?? '';
    const suggestion = asString(entry.suggestion);
    const reason = asString(entry.reason);
    if (!suggestion || !reason) continue;

    const key = `${area}|${original}|${suggestion}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ area, original, suggestion, reason });
  }
  return out.slice(0, 8);
};

/** Analyse resume text and return accept/reject-ready suggestions. */
export const improveResume = async (input: IImproveResumeInput): Promise<IResumeSuggestion[]> => {
  requireAI();

  const text = input.text.trim();
  if (text.length < 40) {
    throw AppError.badRequest('Resume text is too short to analyse');
  }

  const requested = input.areas?.length ? input.areas : AREAS;
  const areas = requested.filter((area) => AREAS.includes(area));
  if (areas.length === 0) {
    throw AppError.badRequest(`Unknown resume area. Allowed: ${AREAS.join(', ')}`);
  }

  const parts = [`Focus areas: ${areas.join(', ')}.`];
  if (input.target_role) parts.push(`Target role: ${input.target_role.trim()}.`);
  parts.push(`Resume text:\n\n${text.slice(0, 12000)}`);

  const raw = await chatJSON<unknown>({
    system: SYSTEM_PROMPT,
    user: parts.join('\n'),
    temperature: 0.4,
  });
  return normalizeSuggestions(raw);
};

/** Whole-document note list helper used by tests to assert area filtering. */
export const allowedAreas = (): ResumeImprovementArea[] => [...AREAS];

export const resumeImprovementService = { improveResume, normalizeSuggestions, allowedAreas };

export default resumeImprovementService;
