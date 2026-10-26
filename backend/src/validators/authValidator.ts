import { z } from 'zod';
import { RoleName } from '../enums';

/** Strong password: at least 8 chars with a mix of letters and numbers. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const emailSchema = z.string().trim().toLowerCase().email('Invalid email address').max(255);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\d+\-\s()]{6,30}$/, 'Invalid phone number')
  .optional();

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  phone: phoneSchema,
  role: z.nativeEnum(RoleName).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
