import { QuestionType } from '../enums';
import { ITimestamps } from './commonInterface';

/**
 * A screening question attached to a job's application form.
 *
 * Rules enforced in the service:
 *   - SINGLE/MULTI_CHOICE must have >= 1 option (entity 20).
 *   - Non-choice types must have NO options.
 *   - Questions are LOCKED (not editable/deletable) once the job has
 *     received at least one application, so existing answers stay coherent.
 */
export interface IJobQuestion extends ITimestamps {
  id: string;
  job_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  position: number;
}

export interface IJobQuestionCreation {
  job_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required?: boolean;
  position?: number;
}

export type IJobQuestionUpdate = Partial<
  Omit<IJobQuestionCreation, 'job_id'>
>;
