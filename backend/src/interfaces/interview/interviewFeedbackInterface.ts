import { ITimestamps } from '../shared/commonInterface';

/**
 * Interviewer feedback on an interview.
 *
 * Constraint: UNIQUE (interview_id, reviewer_id) — one feedback per reviewer
 * per interview. Scores are bounded 1–5 (validated in the service/Zod).
 */
export interface IInterviewFeedback extends ITimestamps {
  id: string;
  interview_id: string;
  reviewer_id: string;
  communication_score: number | null;
  technical_score: number | null;
  cultural_fit_score: number | null;
  overall_score: number | null;
  strengths: string | null;
  weaknesses: string | null;
  comments: string | null;
  recommendation: string | null;
}

export interface IInterviewFeedbackCreation {
  interview_id: string;
  reviewer_id: string;
  communication_score?: number | null;
  technical_score?: number | null;
  cultural_fit_score?: number | null;
  overall_score?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  comments?: string | null;
  recommendation?: string | null;
}

export type IInterviewFeedbackUpdate = Partial<
  Omit<IInterviewFeedbackCreation, 'interview_id' | 'reviewer_id'>
>;
