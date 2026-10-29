import { z } from 'zod';
import { CatalogStatus } from '../enums';

/** Industry validators (name required; slug generated server-side). */
const industryBaseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.nativeEnum(CatalogStatus).default(CatalogStatus.ACTIVE),
});

export const createIndustrySchema = industryBaseSchema;

export const updateIndustrySchema = industryBaseSchema.partial();

export const industryQuerySchema = z.object({
  status: z.nativeEnum(CatalogStatus).optional(),
});

export type CreateIndustryInput = z.infer<typeof createIndustrySchema>;
export type UpdateIndustryInput = z.infer<typeof updateIndustrySchema>;
