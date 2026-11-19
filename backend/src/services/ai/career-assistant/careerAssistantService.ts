import { AppError } from '../../../utils';
import { CareerQuickAction, ICareerChatReply } from '../../../interfaces';
import {
  aiChatMessageRepository,
  jobseekerProfileRepository,
  jobseekerProfileSkillRepository,
} from '../../../repositories';
import { requireAI } from '../shared/aiConfig';
import { chatText } from '../shared/openaiClient';

/**
 * AI career assistant (Phase 2, feature 4).
 *
 * A stored per-user chat (flat `ai_chat_messages` table, rolling window of
 * the last 12 messages sent as context). Quick actions are canned system
 * prompts so the frontend buttons (career strategy, resume review, interview
 * prep, skill analysis, discover jobs) get focused answers from the same
 * conversation store.
 */

const HISTORY_WINDOW = 12;
const MAX_KEEP = 100;

const QUICK_ACTION_PROMPTS: Record<CareerQuickAction, string> = {
  CAREER_STRATEGY:
    'Focus on career strategy: realistic paths from the user\'s current position, 6-12 month plan, and trade-offs between paths.',
  RESUME_REVIEW:
    'Focus on resume review: assess the profile the user has and give specific, prioritised resume fixes.',
  INTERVIEW_PREP:
    'Focus on interview preparation: anticipate likely questions for the user\'s target roles and coach answers.',
  SKILL_ANALYSIS:
    'Focus on skill analysis: identify the user\'s strongest skills and the highest-leverage gaps to close next.',
  DISCOVER_JOBS:
    'Focus on job discovery: recommend kinds of roles and search strategies that fit the user\'s profile.',
};

const BASE_SYSTEM = `You are the career assistant inside a job portal (MeroKhoj).
You help jobseekers with career paths, missing skills, interview preparation,
profile improvement and discovering relevant jobs.
Rules:
- Be concrete and actionable; prefer steps over generalities.
- Ground advice in the profile context provided below; if context is missing, ask one short clarifying question.
- Never fabricate job listings, salaries or employer names.
- Keep replies under 220 words unless the user explicitly asks for more.
- Plain text only: no markdown headings, no emoji.`;

const isQuickAction = (value: unknown): value is CareerQuickAction =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(QUICK_ACTION_PROMPTS, value);

/** Build a short profile context block (headline, skills, experience years). */
const profileContext = async (userId: string): Promise<string> => {
  const profile = await jobseekerProfileRepository.findByUserId(userId);
  if (!profile) return 'Profile: not completed yet.';

  const skills = await jobseekerProfileSkillRepository.listByUserId(userId);
  const lines = ['Profile context:'];
  if (profile.headline) lines.push(`Headline: ${profile.headline}`);
  if (profile.professional_summary) lines.push(`Summary: ${profile.professional_summary}`);
  if (profile.city || profile.country) {
    lines.push(`Location: ${[profile.city, profile.country].filter(Boolean).join(', ')}`);
  }
  lines.push(
    `Skills: ${skills.length > 0 ? skills.map((skill) => skill.name).join(', ') : 'none listed yet'}`,
  );
  return lines.join('\n');
};

export interface IChatInput {
  userId: string;
  message: string;
  quick_action?: CareerQuickAction | null;
}

/** Send one message and get the assistant reply (both turns persisted). */
export const sendMessage = async (input: IChatInput): Promise<ICareerChatReply> => {
  requireAI();

  const message = input.message.trim();
  if (!message) throw AppError.badRequest('Message cannot be empty');
  if (message.length > 4000) throw AppError.badRequest('Message is too long (max 4000 chars)');

  const quickAction = isQuickAction(input.quick_action) ? input.quick_action : null;
  const [history, context] = await Promise.all([
    aiChatMessageRepository.listRecent(input.userId, HISTORY_WINDOW),
    profileContext(input.userId),
  ]);

  const system = [
    BASE_SYSTEM,
    quickAction ? QUICK_ACTION_PROMPTS[quickAction] : '',
    context,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Replay history as alternating turns so the model sees the conversation.
  const historyText = history
    .map((row) => `${row.role === 'user' ? 'User' : 'Assistant'}: ${row.content}`)
    .join('\n');

  const reply = await chatText({
    system,
    user: historyText ? `${historyText}\nUser: ${message}` : message,
    temperature: 0.6,
  });

  await aiChatMessageRepository.append(input.userId, 'user', message, quickAction ? { quick_action: quickAction } : null);
  await aiChatMessageRepository.append(input.userId, 'assistant', reply, null);
  await aiChatMessageRepository.prune(input.userId, MAX_KEEP);

  return { reply, quick_action: quickAction };
};

/** Recent conversation, oldest first (for rendering chat history). */
export const getHistory = async (
  userId: string,
  limit = HISTORY_WINDOW,
): Promise<Array<{ role: string; content: string; created_at: Date }>> => {
  const rows = await aiChatMessageRepository.listRecent(userId, Math.min(Math.max(limit, 1), 50));
  return rows.map((row) => ({
    role: row.role,
    content: row.content,
    created_at: row.created_at,
  }));
};

/** Wipe the user's chat history. */
export const clearHistory = async (userId: string): Promise<void> => {
  await aiChatMessageRepository.clearForUser(userId);
};

export const careerAssistantService = { sendMessage, getHistory, clearHistory };

export default careerAssistantService;
