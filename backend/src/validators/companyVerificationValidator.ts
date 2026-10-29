import { z } from 'zod';
import { CompanyVerificationStatus } from '../enums';

/**
 * Company verification validators. A submission only carries a document URL
 * and optional remarks; the status is managed by the service layer (PENDING on
 * submit, VERIFIED/REJECTED on admin review).
 */
export const submitVerificationSchema = z.object({
  document_url: z.string().trim().url().max(2000).optional().nullable(),
  remarks: z.string().trim().max(2000).optional().nullable(),
});

export const reviewVerificationSchema = z.object({
  status: z.enum([
    CompanyVerificationStatus.VERIFIED,
    CompanyVerificationStatus.REJECTED,
  ]),
  remarks: z.string().trim().max(2000).optional().nullable(),
});

/** Admin queue filters. */
export const verificationQuerySchema = z.object({
  status: z.nativeEnum(CompanyVerificationStatus).optional(),
});

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;
export type VerificationQueryInput = z.infer<typeof verificationQuerySchema>;
