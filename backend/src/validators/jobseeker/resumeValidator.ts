import { z } from 'zod';

/**
 * Resume validators. File type must be an allowed extension and size must be
 * positive (the service layer additionally enforces the size ceiling).
 */
export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

const resumeBaseSchema = z.object({
  title: z.string().trim().min(1).max(150),
  file_url: z.string().trim().min(1).max(2000),
  file_name: z.string().trim().min(1).max(255),
  file_type: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(
      (val) =>
        (ALLOWED_RESUME_EXTENSIONS as readonly string[]).includes(val.toLowerCase()) ||
        (ALLOWED_RESUME_EXTENSIONS as readonly string[]).includes(
          `.${val.toLowerCase().replace(/^\.?/, '')}`,
        ),
      { message: `file_type must be one of ${ALLOWED_RESUME_EXTENSIONS.join(', ')}` },
    ),
  file_size_bytes: z
    .number()
    .int()
    .positive('file_size_bytes must be greater than 0')
    .max(10 * 1024 * 1024, 'Resume exceeds the 10 MB limit'),
  is_default: z.boolean().default(false),
});

export const createResumeSchema = resumeBaseSchema;

export const updateResumeSchema = resumeBaseSchema.partial();

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
