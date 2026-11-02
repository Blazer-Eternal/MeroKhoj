import { z } from 'zod';
import { QuestionType, QUESTION_TYPES_REQUIRING_OPTIONS } from '../../enums';

/** Screening question validators (type ↔ options rules). */
const questionBaseSchema = z.object({
  question_text: z.string().trim().min(1).max(2000),
  question_type: z.nativeEnum(QuestionType),
  is_required: z.boolean().optional(),
});

export const createQuestionSchema = questionBaseSchema
  .extend({
    /** For choice questions: the selectable options (>= 1). */
    options: z.array(z.string().trim().min(1).max(500)).optional(),
  })
  .superRefine((value, ctx) => {
    // Cross-field: choice questions must supply options; others must not.
    if (
      QUESTION_TYPES_REQUIRING_OPTIONS.includes(value.question_type) &&
      (!value.options || value.options.length < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'This question type requires at least one option',
      });
    }
    if (
      !QUESTION_TYPES_REQUIRING_OPTIONS.includes(value.question_type) &&
      value.options &&
      value.options.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'This question type cannot have options',
      });
    }
  });

export const updateQuestionSchema = questionBaseSchema.partial();

export const setOptionsSchema = z.object({
  options: z.array(z.string().trim().min(1).max(500)),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SetOptionsInput = z.infer<typeof setOptionsSchema>;
