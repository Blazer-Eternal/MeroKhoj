import { z } from 'zod';

/** Notification validators (inbox queries and read toggles). */
export const notificationQuerySchema = z.object({
  unread_only: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
