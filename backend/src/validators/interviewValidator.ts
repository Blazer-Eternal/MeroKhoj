import { z } from 'zod';
import { InterviewType, InterviewStatus } from '../enums';

export const scheduleInterviewSchema = z
  .object({
    application_id: z.string().uuid('Invalid application id'),
    interview_type: z.nativeEnum(InterviewType),
    scheduled_at: z.coerce.date(),
    duration_minutes: z.number().int().min(15).max(240),
    location: z.string().trim().max(1000).optional().nullable(),
    meeting_url: z.string().url().max(1000).optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((data) => data.location || data.meeting_url, {
    message: 'Either location or meeting_url must be provided',
    path: ['meeting_url'],
  });

export const updateInterviewSchema = z.object({
  interview_type: z.nativeEnum(InterviewType).optional(),
  scheduled_at: z.coerce.date().optional(),
  duration_minutes: z.number().int().min(15).max(240).optional(),
  location: z.string().trim().max(1000).optional().nullable(),
  meeting_url: z.string().url().max(1000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const changeInterviewStatusSchema = z.object({
  status: z.nativeEnum(InterviewStatus),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type ChangeInterviewStatusInput = z.infer<typeof changeInterviewStatusSchema>;
