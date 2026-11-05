import { z } from 'zod';
import { CatalogStatus } from '../../enums';

/** Service plan validators (entity 33). */

/** DECIMAL(12,2), >= 0. */
const priceSchema = z.coerce.number().min(0).max(9999999999.99);

export const createServicePlanSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(5000).optional().nullable(),
  price: priceSchema,
  currency: z.string().trim().min(1).max(10).optional(),
  // NULL duration = the entitlement never expires.
  duration_days: z.coerce.number().int().positive().optional().nullable(),
  // NULL limit = unlimited job postings.
  job_posting_limit: z.coerce.number().int().min(0).optional().nullable(),
  featured_jobs_limit: z.coerce.number().int().min(0).optional(),
  status: z.nativeEnum(CatalogStatus).optional(),
});

export type CreateServicePlanInput = z.infer<typeof createServicePlanSchema>;

/** Partial update — every field optional. */
export const updateServicePlanSchema = createServicePlanSchema.partial();

export type UpdateServicePlanInput = z.infer<typeof updateServicePlanSchema>;

export const listServicePlansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  // Admin-only filter; the public endpoint forces ACTIVE regardless.
  status: z.nativeEnum(CatalogStatus).optional(),
});

export type ListServicePlansQuery = z.infer<typeof listServicePlansQuerySchema>;
