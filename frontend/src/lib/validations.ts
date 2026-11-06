/**
 * Client-side form validation (zod) — mirrors backend validator rules where
 * the user sees them (auth, search, profile forms). The backend validates
 * again on every submit; these are UX-only.
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirm: z.string(),
    role: z.enum(['JOBSEEKER', 'RECRUITER', 'COMPANY_ADMIN']).default('JOBSEEKER'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

/** Job search query (public /jobs page). */
export const jobSearchSchema = z.object({
  q: z.string().trim().max(255).optional(),
  employment_type: z.string().optional(),
  experience_level: z.string().optional(),
  location: z.string().trim().max(255).optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  category_id: z.string().uuid().optional(),
  industry_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(150),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Tell us a little more (10+ characters)').max(5000),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
