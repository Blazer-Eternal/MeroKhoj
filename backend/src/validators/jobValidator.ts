import { z } from 'zod';
import {
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  JobSkillImportance,
} from '../enums';

const createJobBaseSchema = z.object({
  company_id: z.string().uuid('Invalid company id'),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(20).max(20000),
  employment_type: z.nativeEnum(EmploymentType),
  experience_level: z.nativeEnum(ExperienceLevel).optional().nullable(),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  salary_currency: z.string().trim().min(1).max(10).optional(),
  vacancies: z.number().int().min(1).default(1),
  education_requirement: z.string().trim().max(1000).optional().nullable(),
  experience_requirement: z.string().trim().max(1000).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  application_deadline: z.coerce.date().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  industry_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
});

// Base object (before cross-field refinement) — used to derive the update schema.
export const createJobSchema = createJobBaseSchema.refine(
  (data) =>
    data.salary_min == null || data.salary_max == null || data.salary_max >= data.salary_min,
  { message: 'salary_max must be greater than or equal to salary_min', path: ['salary_max'] },
);

export const updateJobSchema = createJobBaseSchema
  .omit({ company_id: true })
  .partial()
  .refine(
    (data) =>
      data.salary_min == null || data.salary_max == null || data.salary_max >= data.salary_min,
    { message: 'salary_max must be greater than or equal to salary_min', path: ['salary_max'] },
  );

export const changeJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
});

export const setJobSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        skill_id: z.string().uuid('Invalid skill id'),
        importance: z.nativeEnum(JobSkillImportance).default(JobSkillImportance.REQUIRED),
        minimum_experience: z.number().min(0).max(50).optional().nullable(),
      }),
    )
    .max(50, 'A job can list at most 50 skills'),
});

export const jobSearchQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  company_id: z.string().uuid().optional(),
  employment_type: z.nativeEnum(EmploymentType).optional(),
  experience_level: z.nativeEnum(ExperienceLevel).optional(),
  location: z.string().trim().max(255).optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  category_id: z.string().uuid().optional(),
  industry_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ChangeJobStatusInput = z.infer<typeof changeJobStatusSchema>;
export type SetJobSkillsInput = z.infer<typeof setJobSkillsSchema>;
export type JobSearchQuery = z.infer<typeof jobSearchQuerySchema>;
