import { z } from 'zod';

/**
 * Education validators.
 * Cross-field rules (end_date >= start_date, is_current ⇒ end_date null)
 * are enforced via superRefine so the API fails fast with a clear message.
 */

const educationBaseSchema = z.object({
  institution: z.string().trim().min(1).max(255),
  degree: z.string().trim().min(1).max(150),
  field_of_study: z.string().trim().max(150).optional().nullable(),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
  is_current: z.boolean().default(false),
  grade: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
});

interface DateRuleInput {
  start_date?: Date | null;
  end_date?: Date | null;
  is_current?: boolean;
}

const withDateRules = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((raw, ctx) => {
    const data = raw as DateRuleInput;
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'end_date must be on or after start_date',
      });
    }
    if (data.is_current && data.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'A current education entry must not have an end_date',
      });
    }
  });

export const createEducationSchema = withDateRules(educationBaseSchema);

export const updateEducationSchema = withDateRules(educationBaseSchema.partial());

export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
