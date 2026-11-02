import { AppError } from '../utils';
import {
  IInterviewFeedback,
  IInterviewFeedbackCreation,
  IInterviewFeedbackUpdate,
  IAuthUser,
} from '../interfaces';
import {
  interviewFeedbackRepository,
  interviewRepository,
  applicationRepository,
} from '../repositories';
import { assertCanManageJobs, assertCanAccessApplication, isPlatformAdmin } from './accessControl';

/**
 * Interview feedback business logic (entity 22).
 *
 * Rules enforced here:
 *   - Only members of the hiring company may write feedback.
 *   - One feedback per reviewer per interview (DB unique); a second attempt
 *     updates the reviewer's own row instead of duplicating it.
 *   - Scores are integers within 1–5.
 */

/** Inclusive score bounds. */
const SCORE_MIN = 1;
const SCORE_MAX = 5;

const assertScoreBounds = (value: number | null | undefined, field: string): void => {
  if (value === null || value === undefined) return;
  if (!Number.isInteger(value) || value < SCORE_MIN || value > SCORE_MAX) {
    throw AppError.badRequest(`${field} must be an integer between ${SCORE_MIN} and ${SCORE_MAX}`);
  }
};

/** Validate every provided score is an in-range integer. */
const assertAllScores = (input: Partial<IInterviewFeedbackCreation>): void => {
  assertScoreBounds(input.communication_score, 'communication_score');
  assertScoreBounds(input.technical_score, 'technical_score');
  assertScoreBounds(input.cultural_fit_score, 'cultural_fit_score');
  assertScoreBounds(input.overall_score, 'overall_score');
};

/** Load an interview + its application, enforcing access. */
const loadInterviewWithAccess = async (
  user: IAuthUser,
  interviewId: string,
): Promise<{ interview: NonNullable<Awaited<ReturnType<typeof interviewRepository.findById>>>; companyId: string }> => {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw AppError.notFound('Interview not found');

  const application = await applicationRepository.findByIdWithJobAndJobseeker(
    interview.application_id,
  );
  if (!application) throw AppError.notFound('Application not found');

  const job = application.job as { company_id?: string } | undefined;
  if (job?.company_id) {
    // Any company member may view; only company members may write feedback.
    await assertCanManageJobs(user, job.company_id);
    return { interview, companyId: job.company_id };
  }
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('You are not authorized for this interview');
  }
  return { interview, companyId: '' };
};

/**
 * Create (or update) the caller's feedback for an interview.
 * A reviewer can only have ONE feedback row per interview.
 */
export const submitFeedback = async (
  user: IAuthUser,
  interviewId: string,
  input: Omit<IInterviewFeedbackCreation, 'interview_id' | 'reviewer_id'>,
): Promise<IInterviewFeedback> => {
  await loadInterviewWithAccess(user, interviewId);
  assertAllScores(input);

  const existing = await interviewFeedbackRepository.findByInterviewAndReviewer(
    interviewId,
    user.id,
  );

  if (existing) {
    // Unique per reviewer: revise the existing row rather than duplicate.
    const updated = await interviewFeedbackRepository.update(existing.id, input);
    if (!updated) throw AppError.notFound('Feedback not found');
    return updated;
  }

  return interviewFeedbackRepository.create({
    ...input,
    interview_id: interviewId,
    reviewer_id: user.id,
  });
};

/** Read one reviewer's feedback for an interview. */
export const getMyFeedback = async (
  user: IAuthUser,
  interviewId: string,
): Promise<IInterviewFeedback | null> => {
  await loadInterviewWithAccess(user, interviewId);
  return interviewFeedbackRepository.findByInterviewAndReviewer(interviewId, user.id);
};

/** All feedback left on an interview (company members / admins). */
export const listFeedback = async (
  user: IAuthUser,
  interviewId: string,
): Promise<IInterviewFeedback[]> => {
  await loadInterviewWithAccess(user, interviewId);
  return interviewFeedbackRepository.listByInterview(interviewId);
};

/** Amend an existing feedback row (its original reviewer only). */
export const updateFeedback = async (
  user: IAuthUser,
  feedbackId: string,
  updates: IInterviewFeedbackUpdate,
): Promise<IInterviewFeedback> => {
  const existing = await interviewFeedbackRepository.findById(feedbackId);
  if (!existing) throw AppError.notFound('Feedback not found');
  if (existing.reviewer_id !== user.id && !isPlatformAdmin(user)) {
    throw AppError.forbidden('You can only edit your own feedback');
  }
  await loadInterviewWithAccess(user, existing.interview_id);
  assertAllScores(updates);

  const updated = await interviewFeedbackRepository.update(feedbackId, updates);
  if (!updated) throw AppError.notFound('Feedback not found');
  return updated;
};

/** Delete a feedback row (its reviewer or a platform admin). */
export const deleteFeedback = async (user: IAuthUser, feedbackId: string): Promise<void> => {
  const existing = await interviewFeedbackRepository.findById(feedbackId);
  if (!existing) throw AppError.notFound('Feedback not found');
  if (existing.reviewer_id !== user.id && !isPlatformAdmin(user)) {
    throw AppError.forbidden('You can only delete your own feedback');
  }
  await interviewFeedbackRepository.destroy(feedbackId);
};

export const interviewFeedbackServices = {
  submitFeedback,
  getMyFeedback,
  listFeedback,
  updateFeedback,
  deleteFeedback,
};

export default interviewFeedbackServices;
