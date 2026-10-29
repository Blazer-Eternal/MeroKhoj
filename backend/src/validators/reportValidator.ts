import { z } from 'zod';
import { ReportEntityType, ReportStatus } from '../enums';

/** Report validators. `entity_id` existence is validated in the service. */
export const createReportSchema = z.object({
  entity_type: z.nativeEnum(ReportEntityType),
  entity_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(150),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum([ReportStatus.RESOLVED, ReportStatus.DISMISSED]),
  reason: z.string().trim().max(2000).optional(),
});

export const reportQuerySchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
