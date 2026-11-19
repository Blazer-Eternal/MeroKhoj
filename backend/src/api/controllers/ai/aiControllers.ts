import { Response } from 'express';
import { ICustomRequest } from '../../../interfaces';
import { asyncHandler } from '../../../middleware';
import {
  applyParsedResume,
  careerAssistantService,
  generateJobDescription,
  improveJobDescription,
  improveResume,
  interviewPrepService,
  parseResumeFile,
  parseResumeText,
  skillGapService,
} from '../../../services';
import {
  applyParsedResumeSchema,
  careerChatSchema,
  generateInterviewSessionSchema,
  generateJdSchema,
  improveJdSchema,
  improveResumeSchema,
  parseResumeSchema,
  semanticSearchQuerySchema,
  skillGapQuerySchema,
  submitAnswerSchema,
} from '../../../validators';
import { parseId } from '../../../utils';
import { semanticSearchService } from '../../../services';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** POST /api/ai/resume/parse — paste-parse fallback (text in, payload out). */
export const parseResume = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = parseResumeSchema.parse(req.body);
  const parsed = await parseResumeText(body.text);
  return ok(res, { parsed }, 201);
});

/**
 * POST /api/ai/resume/parse/file — multipart upload parse.
 * Multer has already buffered the file onto `req.file` (see uploadResumeFile
 * middleware); this validates it and returns the structured payload.
 */
export const parseResumeUpload = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Attach a resume file (field "file")' },
    });
  }
  const parsed = await parseResumeFile(file.buffer, file.originalname, file.mimetype);
  return ok(res, { parsed }, 201);
});

/** POST /api/ai/resume/apply — merge a parsed payload into the profile. */
export const applyParsed = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = applyParsedResumeSchema.parse(req.body);
  const result = await applyParsedResume(req.user!.id, body.parsed, body.overwrite);
  return ok(res, { applied: result });
});

/** POST /api/ai/resume/improve — actionable suggestions (CVCraft-style). */
export const improveResumeController = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = improveResumeSchema.parse(req.body);
  const suggestions = await improveResume({
    text: body.text,
    areas: body.areas,
    target_role: body.target_role ?? null,
  });
  return ok(res, { suggestions });
});

/** POST /api/ai/job-descriptions/generate — structured draft for review. */
export const generateJd = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = generateJdSchema.parse(req.body);
  const draft = await generateJobDescription({
    title: body.title,
    requirements: body.requirements ?? null,
    employment_type: body.employment_type ?? null,
    experience_level: body.experience_level ?? null,
    location: body.location ?? null,
    skills: body.skills,
    tone: body.tone,
  });
  return ok(res, { draft }, 201);
});

/** POST /api/ai/job-descriptions/improve — change tone / adjust length. */
export const improveJd = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = improveJdSchema.parse(req.body);
  const draft = await improveJobDescription({
    draft: body.draft,
    action: body.action,
    tone: body.tone,
    length: body.length,
  });
  return ok(res, { draft });
});

/** POST /api/ai/career-assistant/message — one chat turn. */
export const chat = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = careerChatSchema.parse(req.body);
  const reply = await careerAssistantService.sendMessage({
    userId: req.user!.id,
    message: body.message,
    quick_action: body.quick_action ?? null,
  });
  return ok(res, reply, 201);
});

/** GET /api/ai/career-assistant/history */
export const chatHistory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const history = await careerAssistantService.getHistory(req.user!.id);
  return ok(res, { history });
});

/** DELETE /api/ai/career-assistant/history */
export const clearChatHistory = asyncHandler(async (req: ICustomRequest, res: Response) => {
  await careerAssistantService.clearHistory(req.user!.id);
  return ok(res, { cleared: true });
});

/** GET /api/ai/skill-gap?job_id=… — radar/bar-friendly gap report. */
export const skillGap = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = skillGapQuerySchema.parse(req.query);
  const report = await skillGapService.analyseSkillGap(req.user!.id, query.job_id);
  return ok(res, { report });
});

/** POST /api/ai/interview/sessions — generate a practice question set. */
export const createInterviewSession = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const body = generateInterviewSessionSchema.parse(req.body);
  const session = await interviewPrepService.generateSession({
    userId: req.user!.id,
    job_title: body.job_title,
    industry: body.industry ?? null,
    skills: body.skills,
    question_count: body.question_count,
  });
  return ok(res, { session }, 201);
});

/** GET /api/ai/interview/sessions — a user's practice history. */
export const listInterviewSessions = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const sessions = await interviewPrepService.listSessions(req.user!.id);
  return ok(res, { sessions });
});

/** GET /api/ai/interview/sessions/:id */
export const getInterviewSession = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const sessionId = parseId(req.params.id, 'session');
  const session = await interviewPrepService.getSession(req.user!.id, sessionId);
  return ok(res, { session });
});

/** POST /api/ai/interview/sessions/:id/questions/:questionId/answer — score it. */
export const answerInterviewQuestion = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const sessionId = parseId(req.params.id, 'session');
  const questionId = parseId(req.params.questionId, 'question');
  const body = submitAnswerSchema.parse(req.body);
  const feedback = await interviewPrepService.submitAnswer({
    userId: req.user!.id,
    sessionId,
    questionId,
    answer: body.answer,
  });
  return ok(res, { feedback });
});

/** GET /api/jobs/semantic?q=… — natural-language search (public). */
export const semanticSearch = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = semanticSearchQuerySchema.parse(req.query);
  const result = await semanticSearchService.searchJobsSemantic({
    query: query.q,
    limit: query.limit,
  });
  return ok(res, result);
});

export default {
  parseResume,
  parseResumeUpload,
  applyParsed,
  improveResume: improveResumeController,
  generateJd,
  improveJd,
  chat,
  chatHistory,
  clearChatHistory,
  skillGap,
  createInterviewSession,
  listInterviewSessions,
  getInterviewSession,
  answerInterviewQuestion,
  semanticSearch,
};
