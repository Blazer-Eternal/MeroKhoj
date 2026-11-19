import { AppError } from '../../../utils';
import {
  IAnswerFeedback,
  IPracticeQuestion,
  IPracticeSession,
} from '../../../interfaces';
import { interviewPracticeRepository } from '../../../repositories';
import { requireAI } from '../shared/aiConfig';
import { chatJSON } from '../shared/openaiClient';
import { asObjectArray, asString, asStringArray, clamp } from '../shared/coerce';

/**
 * AI interview preparation (Phase 2, feature 6).
 *
 * Two generative steps, both persisted:
 *   1. `generateSession` — question set for a job title/industry/skills
 *      (stored as a session + ordered questions);
 *   2. `submitAnswer` — the candidate's practice answer scored with a
 *      breakdown (relevance/structure/specificity/communication), strengths,
 *      improvements and one insight — matching the reference score card.
 */

const MAX_QUESTIONS = 10;
const MIN_QUESTIONS = 3;

const GENERATE_SYSTEM = `You are an experienced interviewer.
Generate practice interview questions for the given role.
Rules:
- Respond with ONLY a JSON object, no prose, no markdown fences.
- Mix categories: technical/functional, behavioural (STAR-style), situational, and role-specific.
- Questions must be specific to the supplied title, industry and skills — never generic filler.
- Each question stands alone (no "as mentioned above").
JSON shape:
{ "questions": [{ "category": string, "question": string }] }`;

const FEEDBACK_SYSTEM = `You are an interview coach scoring one practice answer.
Rules:
- Respond with ONLY a JSON object, no prose, no markdown fences.
- score: integer 0-100 (holistic).
- breakdown: four integers 0-100 for relevance, structure, specificity, communication.
- strengths: 1-3 short strings that worked in the answer.
- improvements: 1-3 short, concrete fixes.
- insight: one sentence with the single highest-leverage next step.
- Judge only what the answer contains; never assume facts the candidate did not say.
JSON shape:
{
  "score": integer,
  "breakdown": { "relevance": integer, "structure": integer, "specificity": integer, "communication": integer },
  "strengths": string[],
  "improvements": string[],
  "insight": string
}`;

export interface IGenerateSessionInput {
  userId: string;
  job_title: string;
  industry?: string | null;
  skills?: string[];
  question_count?: number;
}

/** Normalise raw model questions (drop empties, cap count). */
export const normalizeQuestions = (raw: unknown): IPracticeQuestion[] => {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const out: IPracticeQuestion[] = [];
  const seen = new Set<string>();

  for (const entry of asObjectArray(record.questions)) {
    const question = asString(entry.question);
    if (!question) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      category: asString(entry.category) ?? 'General',
      question,
    });
  }
  return out;
};

/** Generate and store a practice session with its questions. */
export const generateSession = async (
  input: IGenerateSessionInput,
): Promise<IPracticeSession> => {
  requireAI();

  const jobTitle = input.job_title.trim();
  if (!jobTitle) throw AppError.badRequest('job_title is required');

  const questionCount = clamp(input.question_count ?? 5, MIN_QUESTIONS, MAX_QUESTIONS, 5);
  const skills = asStringArray(input.skills);

  const user = [
    `Job title: ${jobTitle}`,
    input.industry ? `Industry: ${input.industry}` : null,
    skills.length > 0 ? `Key skills: ${skills.join(', ')}` : null,
    `Generate exactly ${questionCount} questions.`,
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await chatJSON<unknown>({
    system: GENERATE_SYSTEM,
    user,
    temperature: 0.6,
  });
  const questions = normalizeQuestions(raw).slice(0, questionCount);
  if (questions.length === 0) {
    throw new AppError('AI returned no usable questions', 502, 'AI_INVALID_RESPONSE', true);
  }

  const session = await interviewPracticeRepository.createSession(input.userId, {
    job_title: jobTitle,
    industry: input.industry ?? null,
    skills,
    question_count: questions.length,
    questions: questions.map((question) => ({
      category: question.category,
      question: question.question,
    })),
  });

  const stored = await interviewPracticeRepository.listQuestions(session.id);
  return {
    id: session.id,
    job_title: session.job_title,
    industry: session.industry,
    skills,
    question_count: session.question_count,
    questions: stored.map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      category: row.category ?? 'General',
      question: row.question,
      answer: row.answer,
      score: row.score,
      feedback: (row.feedback as IAnswerFeedback | null) ?? null,
      answered_at: row.answered_at,
    })),
    created_at: session.created_at,
  };
};

/** Normalise raw feedback into a typed `IAnswerFeedback`. */
export const normalizeFeedback = (raw: unknown): IAnswerFeedback => {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const breakdownRaw = (typeof record.breakdown === 'object' && record.breakdown !== null
    ? record.breakdown
    : {}) as Record<string, unknown>;

  return {
    score: Math.round(clamp(record.score, 0, 100, 0)),
    breakdown: {
      relevance: Math.round(clamp(breakdownRaw.relevance, 0, 100, 0)),
      structure: Math.round(clamp(breakdownRaw.structure, 0, 100, 0)),
      specificity: Math.round(clamp(breakdownRaw.specificity, 0, 100, 0)),
      communication: Math.round(clamp(breakdownRaw.communication, 0, 100, 0)),
    },
    strengths: asStringArray(record.strengths).slice(0, 3),
    improvements: asStringArray(record.improvements).slice(0, 3),
    insight: asString(record.insight) ?? '',
  };
};

export interface ISubmitAnswerInput {
  userId: string;
  sessionId: string;
  questionId: string;
  answer: string;
}

/** Score one practice answer, persist it, return the feedback. */
export const submitAnswer = async (input: ISubmitAnswerInput): Promise<IAnswerFeedback> => {
  requireAI();

  const answer = input.answer.trim();
  if (answer.length < 10) {
    throw AppError.badRequest('Answer is too short to score (min 10 characters)');
  }
  if (answer.length > 6000) {
    throw AppError.badRequest('Answer is too long (max 6000 characters)');
  }

  const session = await interviewPracticeRepository.findSession(input.sessionId, input.userId);
  if (!session) throw AppError.notFound('Practice session not found');

  const question = await interviewPracticeRepository.findQuestion(
    input.questionId,
    input.sessionId,
  );
  if (!question) throw AppError.notFound('Question not found in this session');

  const raw = await chatJSON<unknown>({
    system: FEEDBACK_SYSTEM,
    user: [
      `Role: ${session.job_title}`,
      session.industry ? `Industry: ${session.industry}` : '',
      `Category: ${question.category ?? 'General'}`,
      `Question: ${question.question}`,
      `Candidate answer: ${answer}`,
    ]
      .filter(Boolean)
      .join('\n'),
    temperature: 0.3,
  });
  const feedback = normalizeFeedback(raw);

  await interviewPracticeRepository.saveAnswer(input.questionId, {
    answer,
    score: feedback.score,
    feedback: feedback as unknown as Record<string, unknown>,
  });

  return feedback;
};

/** Load a session with its questions (ownership enforced). */
export const getSession = async (
  userId: string,
  sessionId: string,
): Promise<IPracticeSession> => {
  const session = await interviewPracticeRepository.findSession(sessionId, userId);
  if (!session) throw AppError.notFound('Practice session not found');

  const stored = await interviewPracticeRepository.listQuestions(sessionId);
  let skills: string[] = [];
  if (Array.isArray(session.skills)) skills = session.skills.filter((s): s is string => typeof s === 'string');

  return {
    id: session.id,
    job_title: session.job_title,
    industry: session.industry,
    skills,
    question_count: session.question_count,
    questions: stored.map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      category: row.category ?? 'General',
      question: row.question,
      answer: row.answer,
      score: row.score,
      feedback: (row.feedback as IAnswerFeedback | null) ?? null,
      answered_at: row.answered_at,
    })),
    created_at: session.created_at,
  };
};

/** List a user's sessions (newest first, no questions). */
export const listSessions = async (userId: string): Promise<IPracticeSession[]> => {
  const rows = await interviewPracticeRepository.listSessions(userId);
  return rows.map((session) => ({
    id: session.id,
    job_title: session.job_title,
    industry: session.industry,
    skills: Array.isArray(session.skills)
      ? session.skills.filter((s): s is string => typeof s === 'string')
      : [],
    question_count: session.question_count,
    questions: [],
    created_at: session.created_at,
  }));
};

export const interviewPrepService = {
  generateSession,
  submitAnswer,
  getSession,
  listSessions,
  normalizeFeedback,
  normalizeQuestions,
};

export default interviewPrepService;
