import { AppError } from '../../utils';
import {
  IApplicationAnswer,
  IApplicationAnswerCreation,
  IAnswerSubmission,
  IAuthUser,
} from '../../interfaces';
import { QuestionType, ApplicationStatus, APPLICATION_TERMINAL_STATUSES } from '../../enums';
import {
  applicationAnswerRepository,
  applicationRepository,
  jobQuestionRepository,
  questionOptionRepository,
} from '../../repositories';
import { assertCanAccessApplication, isPlatformAdmin } from '../shared/accessControl';

/**
 * Application answers business logic (entity 21).
 *
 * The core rule: the submitted answer FORMAT must match the question type.
 *   TEXT      → answer_text
 *   NUMBER    → answer_number
 *   BOOLEAN   → answer_boolean
 *   DATE      → answer_date
 *   SINGLE_CHOICE → selected_option_id (must belong to the question)
 *   MULTI_CHOICE  → selected_option_ids (all must belong to the question)
 *
 * Answers may only be written while the application is still active (not in a
 * terminal state).
 */

/** Narrow a raw submission value into the typed columns for a question. */
const buildAnswerPayload = async (
  applicationId: string,
  questionId: string,
  questionType: QuestionType,
  value: IAnswerSubmission['value'],
): Promise<IApplicationAnswerCreation> => {
  const base: IApplicationAnswerCreation = { application_id: applicationId, question_id: questionId };

  switch (questionType) {
    case QuestionType.TEXT: {
      if (typeof value !== 'string') {
        throw AppError.unprocessable('This question requires a text answer');
      }
      return { ...base, answer_text: value };
    }
    case QuestionType.NUMBER: {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw AppError.unprocessable('This question requires a numeric answer');
      }
      return { ...base, answer_number: value };
    }
    case QuestionType.BOOLEAN: {
      if (typeof value !== 'boolean') {
        throw AppError.unprocessable('This question requires a true/false answer');
      }
      return { ...base, answer_boolean: value };
    }
    case QuestionType.DATE: {
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw AppError.unprocessable('This question requires a valid date answer');
      }
      return { ...base, answer_date: value };
    }
    case QuestionType.SINGLE_CHOICE: {
      if (typeof value !== 'string') {
        throw AppError.unprocessable('This question requires a single selected option');
      }
      const option = await questionOptionRepository.findById(value);
      if (!option || option.question_id !== questionId) {
        throw AppError.unprocessable('Selected option does not belong to this question');
      }
      return { ...base, selected_option_id: value };
    }
    case QuestionType.MULTI_CHOICE: {
      if (!Array.isArray(value) || value.length === 0) {
        throw AppError.unprocessable('This question requires one or more selected options');
      }
      const ids = value.filter((v): v is string => typeof v === 'string');
      if (ids.length !== value.length) {
        throw AppError.unprocessable('Selected options must be option ids');
      }
      // Every referenced option must belong to this question.
      const validCount = await questionOptionRepository.countByIdsForQuestion(questionId, ids);
      if (validCount !== ids.length) {
        throw AppError.unprocessable('One or more selected options do not belong to this question');
      }
      return { ...base, selected_option_ids: ids };
    }
    default:
      throw AppError.badRequest('Unsupported question type');
  }
};

/** Assert the application is in a state that still accepts answers. */
const assertAnswersEditable = (application: { status: ApplicationStatus }): void => {
  if (APPLICATION_TERMINAL_STATUSES.includes(application.status)) {
    throw AppError.conflict(
      `An application in status ${application.status} can no longer be edited`,
    );
  }
};

/**
 * Submit answers for an application (jobseeker, own application only).
 * Answers are upserted per question so a draft can be corrected.
 */
export const submitAnswers = async (
  user: IAuthUser,
  applicationId: string,
  submissions: IAnswerSubmission[],
): Promise<IApplicationAnswer[]> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  // Only the applicant (or a platform admin) may write answers.
  if (application.jobseeker_id !== user.id && !isPlatformAdmin(user)) {
    throw AppError.forbidden('You can only answer questions on your own application');
  }
  assertAnswersEditable(application);

  const results: IApplicationAnswer[] = [];
  for (const submission of submissions) {
    const question = await jobQuestionRepository.findById(submission.question_id);
    if (!question) throw AppError.notFound('Question not found');

    const payload = await buildAnswerPayload(
      applicationId,
      question.id,
      question.question_type,
      submission.value,
    );

    // One row per (application, question): update if it already exists.
    const existing = (await applicationAnswerRepository.listByApplication(applicationId)).find(
      (a) => a.question_id === question.id,
    );
    if (existing) {
      const updated = await applicationAnswerRepository.update(existing.id, payload);
      if (updated) results.push(updated);
    } else {
      results.push(await applicationAnswerRepository.create(payload));
    }
  }

  return results;
};

/** Read answers for an application (applicant or company member). */
export const listAnswers = async (
  user: IAuthUser,
  applicationId: string,
): Promise<IApplicationAnswer[]> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');
  await assertCanAccessApplication(user, application);
  return applicationAnswerRepository.listByApplication(applicationId);
};

/** Validate required questions were answered (used before final decisions). */
export const assertRequiredAnswered = async (applicationId: string): Promise<void> => {
  const application = await applicationRepository.findById(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  const questions = await jobQuestionRepository.listByJob(application.job_id);
  const answers = await applicationAnswerRepository.listByApplication(applicationId);
  const answeredIds = new Set(answers.map((a) => a.question_id));

  const missing = questions.filter((q) => q.is_required && !answeredIds.has(q.id));
  if (missing.length > 0) {
    throw AppError.conflict(
      `Required questions unanswered: ${missing.map((q) => q.question_text).join('; ')}`,
    );
  }
};

export const applicationAnswerServices = {
  submitAnswers,
  listAnswers,
  assertRequiredAnswered,
};

export default applicationAnswerServices;
