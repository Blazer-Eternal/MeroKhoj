import { ITimestamps } from './commonInterface';

/**
 * An answer to one screening question, submitted with an application.
 *
 * Rules enforced in the service:
 *   - The answer FORMAT must match the question type (e.g. a NUMBER question
 *     stores a numeric value; a SINGLE_CHOICE answer must reference an option
 *     that belongs to that question).
 *   - UNIQUE (application_id, question_id) — one answer per question.
 */
export interface IApplicationAnswer extends ITimestamps {
  id: string;
  application_id: string;
  question_id: string;
  /** Free-form/textual answer value (serialized for non-text types). */
  answer_text: string | null;
  /** Numeric answer, set for NUMBER questions. */
  answer_number: number | null;
  /** Boolean answer, set for BOOLEAN questions. */
  answer_boolean: boolean | null;
  /** Date answer, set for DATE questions (DATEONLY). */
  answer_date: Date | null;
  /** Selected option id for SINGLE_CHOICE questions. */
  selected_option_id: string | null;
  /** Selected option ids for MULTI_CHOICE questions (JSONB array). */
  selected_option_ids: string[] | null;
}

export interface IApplicationAnswerCreation {
  application_id: string;
  question_id: string;
  answer_text?: string | null;
  answer_number?: number | null;
  answer_boolean?: boolean | null;
  answer_date?: Date | null;
  selected_option_id?: string | null;
  selected_option_ids?: string[] | null;
}

/** Payload shape for submitting answers alongside an application. */
export interface IAnswerSubmission {
  question_id: string;
  value: string | number | boolean | Date | string[] | null;
}
