import { z } from 'zod';
import { EmploymentType } from '../enums';

/**
 * Work experience validators with the same date invariants as education:
 * end_date >= start_date and is_current ⇒ no end_date.
 */

const experienceBaseSchema = z.object({
  company_name: z.string().trim().min(1).max(255),
  job_title: z.string().trim().min(1).max(200),
  employment_type: z.nativeEnum(EmploymentType),
  location: z.string().trim().max(255).optional().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().trim().max(5000).optional().nullable(),
});

interface ExperienceRuleInput {
  start_date?: Date | null;
  end_date?: Date | null;
  is_current?: boolean;
}

const withDateRules = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((raw, ctx) => {
    const data = raw as ExperienceRuleInput;
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
        message: 'A current experience entry must not have an end_date',
      });
    }
  });

export const createExperienceSchema = withDateRules(experienceBaseSchema);

export const updateExperienceSchema = withDateRules(experienceBaseSchema.partial());

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
