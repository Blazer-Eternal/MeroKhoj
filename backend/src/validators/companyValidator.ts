import { z } from 'zod';
import { CompanySize, CompanyRole } from '../enums';

export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  logo_url: z.string().url().max(1000).optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  email: z.string().trim().toLowerCase().email().max(255).optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^[\d+\-\s()]{6,30}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  industry: z.string().trim().max(150).optional().nullable(),
  company_size: z.nativeEnum(CompanySize).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const addCompanyMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user id'),
  role: z.nativeEnum(CompanyRole),
});

export const updateCompanyMemberSchema = z.object({
  role: z.nativeEnum(CompanyRole),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type AddCompanyMemberInput = z.infer<typeof addCompanyMemberSchema>;
export type UpdateCompanyMemberInput = z.infer<typeof updateCompanyMemberSchema>;
