import { ITimestamps } from '../shared/commonInterface';

/**
 * One selectable option for a choice question.
 * Constraint: UNIQUE (question_id, option_text) — no duplicate options.
 */
export interface IQuestionOption extends ITimestamps {
  id: string;
  question_id: string;
  option_text: string;
  position: number;
}

export interface IQuestionOptionCreation {
  question_id: string;
  option_text: string;
  position?: number;
}
