import { z } from 'zod';
import { ApplicationStatus, ApplicationSource } from '../enums';

export const applyToJobSchema = z.object({
  resume_url: z.string().url('Must be a valid URL').max(1000).optional(),
  cover_letter: z.string().trim().max(10000).optional(),
  source: z.nativeEnum(ApplicationSource).optional(),
});

export const changeApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export const withdrawApplicationSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

export const applicationListQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  job_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
});

export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;
export type ChangeApplicationStatusInput = z.infer<typeof changeApplicationStatusSchema>;
export type WithdrawApplicationInput = z.infer<typeof withdrawApplicationSchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
