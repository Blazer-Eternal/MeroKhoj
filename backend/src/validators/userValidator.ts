import { z } from 'zod';
import { Availability, ProfileVisibility } from '../enums';

export const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().min(1).max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{6,30}$/, 'Invalid phone number')
    .optional()
    .nullable(),
});

export const updateJobseekerProfileSchema = z.object({
  headline: z.string().trim().max(255).optional().nullable(),
  professional_summary: z.string().trim().max(5000).optional().nullable(),
  date_of_birth: z.coerce.date().optional().nullable(),
  gender: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  profile_photo_url: z.string().url().max(1000).optional().nullable(),
  expected_salary: z.number().min(0).optional().nullable(),
  availability: z.nativeEnum(Availability).optional().nullable(),
  profile_visibility: z.nativeEnum(ProfileVisibility).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateJobseekerProfileInput = z.infer<typeof updateJobseekerProfileSchema>;
