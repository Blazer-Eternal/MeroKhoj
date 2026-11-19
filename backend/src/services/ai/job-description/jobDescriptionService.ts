import { AppError } from '../../../utils';
import { IJobDescriptionDraft, JDTone, JD_TONES } from '../../../interfaces';
import { requireAI } from '../shared/aiConfig';
import { chatJSON } from '../shared/openaiClient';
import { asString, asStringArray } from '../shared/coerce';

/**
 * AI job description generator (Phase 2, feature 3).
 *
 * Stateless: employers send a title + basic requirements and get back a
 * structured draft they review before publishing (overview, responsibilities,
 * qualifications, skills, experience). Tone is selectable
 * (Neutral/Formal/Funny/Academic/Exciting) and the `improveJobDescription`
 * action rewrites an existing draft — change tone or adjust length — without
 * touching the facts the employer supplied.
 */

const TONE_DESCRIPTIONS: Record<JDTone, string> = {
  NEUTRAL: 'professional and balanced, plain business English',
  FORMAL: 'formal and corporate, traditional hiring language',
  FUNNY: 'light-hearted and witty but still credible; never mocking',
  ACADEMIC: 'precise and analytical, evidence-oriented wording',
  EXCITING: 'energetic and motivating, action-driven startup voice',
};

const SYSTEM_PROMPT = `You are a senior technical recruiter who writes job postings.
Given a job title and the employer's requirements, write a complete job description.
Rules:
- Respond with ONLY a JSON object, no prose, no markdown fences.
- Use every fact the employer supplied; never invent salary, benefits, deadlines or company claims.
- responsibilities: 4-7 bullet strings.
- required_qualifications: 3-6 bullet strings (education, years, certifications).
- required_skills: 3-10 short skill strings (technologies, methods).
- experience_requirements: one plain-text sentence or short paragraph.
- overview: 2-4 sentences selling the role.
- Write entirely in the requested tone.
JSON shape:
{
  "tone": string,
  "overview": string,
  "responsibilities": string[],
  "required_qualifications": string[],
  "required_skills": string[],
  "experience_requirements": string
}`;

export interface IJobDescriptionInput {
  title: string;
  /** Free-form employer requirements (must hives, nice to haves). */
  requirements?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  location?: string | null;
  skills?: string[];
  tone: JDTone;
}

const assertTone = (tone: string): JDTone => {
  if ((JD_TONES as readonly string[]).includes(tone)) return tone as JDTone;
  throw AppError.badRequest(`Unknown tone. Allowed: ${JD_TONES.join(', ')}`);
};

/** Normalise raw model output into a typed draft (missing parts → []). */
export const normalizeDraft = (raw: unknown, tone: JDTone): IJobDescriptionDraft => {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    tone,
    overview: asString(record.overview) ?? '',
    responsibilities: asStringArray(record.responsibilities),
    required_qualifications: asStringArray(record.required_qualifications),
    required_skills: asStringArray(record.required_skills),
    experience_requirements: asString(record.experience_requirements) ?? '',
  };
};

const describeInput = (input: IJobDescriptionInput): string => {
  const lines = [`Job title: ${input.title}`];
  if (input.employment_type) lines.push(`Employment type: ${input.employment_type}`);
  if (input.experience_level) lines.push(`Experience level: ${input.experience_level}`);
  if (input.location) lines.push(`Location: ${input.location}`);
  if (input.skills?.length) lines.push(`Employer-listed skills: ${input.skills.join(', ')}`);
  if (input.requirements) lines.push(`Employer requirements:\n${input.requirements}`);
  lines.push(`Tone: ${TONE_DESCRIPTIONS[input.tone]}`);
  return lines.join('\n');
};

/** Generate a fresh structured job description draft. */
export const generateJobDescription = async (
  input: IJobDescriptionInput,
): Promise<IJobDescriptionDraft> => {
  requireAI();
  const tone = assertTone(input.tone);
  if (!input.title.trim()) throw AppError.badRequest('Job title is required');

  const raw = await chatJSON<unknown>({
    system: SYSTEM_PROMPT,
    user: describeInput({ ...input, tone }),
    temperature: 0.6,
  });
  return normalizeDraft(raw, tone);
};

export type ImproveAction = 'CHANGE_TONE' | 'ADJUST_LENGTH';

export interface IImproveJobDescriptionInput {
  draft: IJobDescriptionDraft;
  action: ImproveAction;
  /** Required for CHANGE_TONE. */
  tone?: JDTone;
  /** Required for ADJUST_LENGTH. */
  length?: 'SHORTER' | 'LONGER';
}

/**
 * Rewrite an existing draft: switch tone (facts preserved) or adjust length
 * (expand/compress bullets and overview).
 */
export const improveJobDescription = async (
  input: IImproveJobDescriptionInput,
): Promise<IJobDescriptionDraft> => {
  requireAI();

  let instruction: string;
  let nextTone = input.draft.tone;
  if (input.action === 'CHANGE_TONE') {
    if (!input.tone) throw AppError.badRequest('tone is required for CHANGE_TONE');
    nextTone = assertTone(input.tone);
    instruction = `Rewrite the draft in this tone: ${TONE_DESCRIPTIONS[nextTone]}.`;
  } else if (input.action === 'ADJUST_LENGTH') {
    if (input.length !== 'SHORTER' && input.length !== 'LONGER') {
      throw AppError.badRequest('length must be SHORTER or LONGER for ADJUST_LENGTH');
    }
    instruction =
      input.length === 'SHORTER'
        ? 'Compress the draft: tighter overview, fewer and shorter bullets, same facts.'
        : 'Expand the draft: richer overview, more detailed bullets, same facts.';
  } else {
    throw AppError.badRequest('Unknown improve action. Allowed: CHANGE_TONE, ADJUST_LENGTH');
  }

  const draft = input.draft;
  const user = [
    instruction,
    'Keep every factual requirement from the original; do not add salary, benefits or company claims.',
    `Current tone: ${TONE_DESCRIPTIONS[draft.tone]}.`,
    'Current draft:',
    `Overview: ${draft.overview}`,
    `Responsibilities: ${JSON.stringify(draft.responsibilities)}`,
    `Required qualifications: ${JSON.stringify(draft.required_qualifications)}`,
    `Required skills: ${JSON.stringify(draft.required_skills)}`,
    `Experience requirements: ${draft.experience_requirements}`,
  ].join('\n');

  const raw = await chatJSON<unknown>({
    system: SYSTEM_PROMPT,
    user,
    temperature: 0.5,
  });
  return normalizeDraft(raw, nextTone);
};

export const jobDescriptionService = {
  generateJobDescription,
  improveJobDescription,
  normalizeDraft,
};

export default jobDescriptionService;
