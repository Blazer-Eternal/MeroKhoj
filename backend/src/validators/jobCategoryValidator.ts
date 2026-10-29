import { z } from 'zod';
import { CatalogStatus } from '../enums';

/** Job category validators (name is required; slug is generated server-side). */
const categoryBaseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  parent_id: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.nativeEnum(CatalogStatus).default(CatalogStatus.ACTIVE),
});

export const createCategorySchema = categoryBaseSchema;

export const updateCategorySchema = categoryBaseSchema.partial();

export const categoryQuerySchema = z.object({
  status: z.nativeEnum(CatalogStatus).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
