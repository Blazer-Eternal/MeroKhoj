import { z } from 'zod';
import { ExperienceLevel } from '../../enums';

/** Analytics query validators (Phase 1). */

/** GET /api/analytics/salary-estimate — every filter is optional. */
export const salaryEstimateQuerySchema = z.object({
  category_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  experience_level: z.nativeEnum(ExperienceLevel).optional(),
});

/** GET /api/analytics/recruitment — employer scope is mandatory. */
export const recruitmentAnalyticsQuerySchema = z.object({
  company_id: z.string().uuid(),
});

export type SalaryEstimateQuery = z.infer<typeof salaryEstimateQuerySchema>;
export type RecruitmentAnalyticsQuery = z.infer<typeof recruitmentAnalyticsQuerySchema>;
