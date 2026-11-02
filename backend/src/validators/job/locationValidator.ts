import { z } from 'zod';

/**
 * Location validators. Coordinate ranges are checked here (and again in the
 * service) so invalid data is rejected before touching the database.
 */
const locationBaseSchema = z.object({
  country: z.string().trim().min(1).max(100),
  province: z.string().trim().max(150).optional().nullable(),
  district: z.string().trim().max(150).optional().nullable(),
  city: z.string().trim().max(150).optional().nullable(),
  address: z.string().trim().max(2000).optional().nullable(),
  postal_code: z.string().trim().max(20).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const createLocationSchema = locationBaseSchema;

export const updateLocationSchema = locationBaseSchema.partial();

export const locationQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  country: z.string().trim().max(100).optional(),
  province: z.string().trim().max(150).optional(),
  district: z.string().trim().max(150).optional(),
  city: z.string().trim().max(150).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationQueryInput = z.infer<typeof locationQuerySchema>;
