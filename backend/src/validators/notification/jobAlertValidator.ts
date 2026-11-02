import { z } from 'zod';
import { JobAlertFrequency, EMPLOYMENT_TYPES } from '../../enums';

/** Job-alert validators. Classification ids are resolved in the service. */
const jobAlertBaseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  keywords: z.string().trim().max(500).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
  employment_type: z.enum(EMPLOYMENT_TYPES as [string, ...string[]]).optional().nullable(),
  is_active: z.boolean().optional(),
  frequency: z.nativeEnum(JobAlertFrequency).optional(),
});

export const createJobAlertSchema = jobAlertBaseSchema;

export const updateJobAlertSchema = jobAlertBaseSchema.partial();

export type CreateJobAlertInput = z.infer<typeof createJobAlertSchema>;
export type UpdateJobAlertInput = z.infer<typeof updateJobAlertSchema>;
