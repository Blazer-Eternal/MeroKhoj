import { z } from 'zod';
import { JD_TONES } from '../../interfaces';

/**
 * Phase 2 AI request validators.
 * Every generative body is bounded so a runaway client cannot push
 * megabytes of text into a prompt.
 */

/** Shared: resume text handed to the parser / improver. */
const resumeText = z.string().trim().min(20, 'Resume text is too short').max(50_000);

/** Structured payload the parser produces (also what clients send back to apply). */
const parsedEducationSchema = z.object({
  institution: z.string().trim().min(1).max(255),
  degree: z.string().trim().min(1).max(255),
  field_of_study: z.string().trim().max(255).nullable().optional().default(null),
  start_date: z.string().trim().max(40).nullable().optional().default(null),
  end_date: z.string().trim().max(40).nullable().optional().default(null),
});

const parsedExperienceSchema = z.object({
  company_name: z.string().trim().min(1).max(255),
  job_title: z.string().trim().min(1).max(255),
  start_date: z.string().trim().max(40).nullable().optional().default(null),
  end_date: z.string().trim().max(40).nullable().optional().default(null),
  is_current: z.boolean().optional().default(false),
  description: z.string().trim().max(5000).nullable().optional().default(null),
});

export const parsedResumeSchema = z.object({
  name: z.string().trim().max(255).nullable().optional().default(null),
  email: z.string().trim().max(255).nullable().optional().default(null),
  phone: z.string().trim().max(50).nullable().optional().default(null),
  city: z.string().trim().max(120).nullable().optional().default(null),
  country: z.string().trim().max(120).nullable().optional().default(null),
  headline: z.string().trim().max(255).nullable().optional().default(null),
  summary: z.string().trim().max(5000).nullable().optional().default(null),
  education: z.array(parsedEducationSchema).max(20).optional().default([]),
  experience: z.array(parsedExperienceSchema).max(30).optional().default([]),
  skills: z.array(z.string().trim().min(1).max(100)).max(80).optional().default([]),
  certifications: z.array(z.string().trim().min(1).max(150)).max(30).optional().default([]),
});

/** POST /api/ai/resume/parse — paste-parse fallback (file upload is multipart). */
export const parseResumeSchema = z.object({
  text: resumeText,
});

/** POST /api/ai/resume/apply — apply a parsed payload to the profile. */
export const applyParsedResumeSchema = z.object({
  parsed: parsedResumeSchema,
  overwrite: z.boolean().optional().default(false),
});

/** POST /api/ai/resume/improve */
export const improveResumeSchema = z.object({
  text: resumeText,
  areas: z
    .array(z.enum(['summary', 'experience', 'skills', 'grammar', 'formatting']))
    .max(5)
    .optional(),
  target_role: z.string().trim().max(255).optional(),
});

/** POST /api/ai/job-descriptions/generate */
export const generateJdSchema = z.object({
  title: z.string().trim().min(2).max(255),
  requirements: z.string().trim().max(5000).optional(),
  employment_type: z.string().trim().max(50).optional(),
  experience_level: z.string().trim().max(50).optional(),
  location: z.string().trim().max(255).optional(),
  skills: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  tone: z.enum(JD_TONES).default('NEUTRAL'),
});

const jdDraftSchema = z.object({
  tone: z.enum(JD_TONES),
  overview: z.string().max(5000),
  responsibilities: z.array(z.string().max(500)).max(15),
  required_qualifications: z.array(z.string().max(500)).max(15),
  required_skills: z.array(z.string().max(150)).max(20),
  experience_requirements: z.string().max(3000),
});

/** POST /api/ai/job-descriptions/improve */
export const improveJdSchema = z.object({
  draft: jdDraftSchema,
  action: z.enum(['CHANGE_TONE', 'ADJUST_LENGTH']),
  tone: z.enum(JD_TONES).optional(),
  length: z.enum(['SHORTER', 'LONGER']).optional(),
});

/** POST /api/ai/career-assistant/message */
export const careerChatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  quick_action: z
    .enum(['CAREER_STRATEGY', 'RESUME_REVIEW', 'INTERVIEW_PREP', 'SKILL_ANALYSIS', 'DISCOVER_JOBS'])
    .nullable()
    .optional(),
});

/** GET /api/ai/skill-gap?job_id=… */
export const skillGapQuerySchema = z.object({
  job_id: z.string().uuid(),
});

/** POST /api/ai/interview/sessions */
export const generateInterviewSessionSchema = z.object({
  job_title: z.string().trim().min(2).max(150),
  industry: z.string().trim().max(100).optional(),
  skills: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  question_count: z.number().int().min(3).max(10).optional(),
});

/** POST /api/ai/interview/sessions/:id/questions/:questionId/answer */
export const submitAnswerSchema = z.object({
  answer: z.string().trim().min(10).max(6000),
});

/** GET /api/jobs/semantic?q=… */
export const semanticSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(500),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
