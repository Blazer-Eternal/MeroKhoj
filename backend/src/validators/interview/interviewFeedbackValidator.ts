import { z } from 'zod';

/**
 * Interview feedback validators. Scores are integers 1–5 (bounds are also
 * re-checked in the service).
 */
const score = z
  .number()
  .int()
  .min(1)
  .max(5)
  .optional()
  .nullable();

const feedbackBaseSchema = z.object({
  communication_score: score,
  technical_score: score,
  cultural_fit_score: score,
  overall_score: score,
  strengths: z.string().trim().max(5000).optional().nullable(),
  weaknesses: z.string().trim().max(5000).optional().nullable(),
  comments: z.string().trim().max(5000).optional().nullable(),
  recommendation: z.string().trim().max(5000).optional().nullable(),
});

export const submitFeedbackSchema = feedbackBaseSchema;

export const updateFeedbackSchema = feedbackBaseSchema.partial();

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
