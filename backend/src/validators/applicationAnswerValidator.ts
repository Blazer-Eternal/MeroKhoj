import { z } from 'zod';

/**
 * Application answer validators.
 *
 * `value` is a union because its shape depends on the question type; the
 * question-type ↔ answer-format match is enforced in the service (it needs
 * the DB to resolve the question).
 */
export const submitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).nullable(),
      }),
    )
    .min(1),
});

export type SubmitAnswersInput = z.infer<typeof submitAnswersSchema>;
