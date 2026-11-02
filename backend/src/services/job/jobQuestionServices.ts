import { AppError } from '../../utils';
import {
  IJobQuestion,
  IJobQuestionCreation,
  IJobQuestionUpdate,
  IQuestionOption,
  IAuthUser,
} from '../../interfaces';
import {
  QuestionType,
  QUESTION_TYPES_REQUIRING_OPTIONS,
  JobStatus,
} from '../../enums';
import {
  jobQuestionRepository,
  questionOptionRepository,
  jobRepository,
  applicationRepository,
} from '../../repositories';
import { assertCanManageJobs, isPlatformAdmin } from '../shared/accessControl';
import { recordAuditForUser } from '../administration/auditLogServices';

/**
 * Screening questions + options business logic (entities 19 & 20).
 *
 * Rules enforced here:
 *   - The question must belong to a job the caller can manage.
 *   - SINGLE_CHOICE / MULTI_CHOICE must have >= 1 option; other types must
 *     have none (options are rejected outright).
 *   - Questions are LOCKED once the job has received any application, so
 *     submitted answers remain coherent.
 */

/** Load a question or throw 404. */
const loadQuestionOrThrow = async (questionId: string): Promise<IJobQuestion> => {
  const question = await jobQuestionRepository.findById(questionId);
  if (!question) throw AppError.notFound('Question not found');
  return question;
};

/** Load a job or throw 404. */
const loadJobOrThrow = async (jobId: string) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');
  return job;
};

/**
 * Questions lock once the job has any application at all — editing the form
 * after answers exist would break answer/question coherence.
 */
const assertFormUnlocked = async (jobId: string): Promise<void> => {
  const applicationCount = await applicationRepository.count({ job_id: jobId });
  if (applicationCount > 0) {
    throw AppError.conflict(
      'The screening form is locked because this job already has applications',
    );
  }
};

/** Authorization: caller manages the job's company (or is a platform admin). */
const assertCanManageQuestionJob = async (
  user: IAuthUser,
  job: { company_id: string },
): Promise<void> => {
  if (isPlatformAdmin(user)) return;
  await assertCanManageJobs(user, job.company_id);
};

/** Enforce the type ↔ options rule at creation/update time. */
const assertOptionsMatchType = (
  questionType: QuestionType,
  optionCount: number,
): void => {
  const needsOptions = QUESTION_TYPES_REQUIRING_OPTIONS.includes(questionType);
  if (needsOptions && optionCount < 1) {
    throw AppError.badRequest(
      `${questionType} questions require at least one option`,
    );
  }
  if (!needsOptions && optionCount > 0) {
    throw AppError.badRequest(
      `${questionType} questions cannot have options`,
    );
  }
};

// ---- Questions ------------------------------------------------------------

/** List a job's screening questions with their options. */
export const listQuestions = async (
  user: IAuthUser,
  jobId: string,
): Promise<(IJobQuestion & { options: IQuestionOption[] })[]> => {
  const job = await loadJobOrThrow(jobId);

  // Public read for published jobs (jobseekers previewing the form);
  // otherwise only the managing company / admins may read the form.
  if (job.status !== JobStatus.PUBLISHED) {
    await assertCanManageQuestionJob(user, job);
  }

  const questions = await jobQuestionRepository.listByJob(jobId);
  const withOptions = await Promise.all(
    questions.map(async (q) => ({
      ...q,
      options: await questionOptionRepository.listByQuestion(q.id),
    })),
  );
  return withOptions;
};

/** Create a question (employer/admin). */
export const createQuestion = async (
  user: IAuthUser,
  jobId: string,
  input: Omit<IJobQuestionCreation, 'job_id' | 'position'> & { options?: string[] },
): Promise<IJobQuestion & { options: IQuestionOption[] }> => {
  const job = await loadJobOrThrow(jobId);
  await assertCanManageQuestionJob(user, job);
  await assertFormUnlocked(jobId);

  const { options: optionTexts, ...questionInput } = input;
  const texts = optionTexts ?? [];
  assertOptionsMatchType(questionInput.question_type, texts.length);

  const position = await jobQuestionRepository.nextPosition(jobId);
  const question = await jobQuestionRepository.create({
    ...questionInput,
    job_id: jobId,
    position,
  });

  const createdOptions: IQuestionOption[] = [];
  for (let i = 0; i < texts.length; i += 1) {
    createdOptions.push(
      await questionOptionRepository.create({
        question_id: question.id,
        option_text: texts[i],
        position: i,
      }),
    );
  }

  await recordAuditForUser(user, {
    action: 'JOB_QUESTION_CREATED',
    entity_type: 'JOB',
    entity_id: jobId,
    new_values: { question_id: question.id, type: question.question_type },
  });

  return { ...question, options: createdOptions };
};

/** Update a question's text/type/required flag (locked once applied). */
export const updateQuestion = async (
  user: IAuthUser,
  questionId: string,
  updates: IJobQuestionUpdate,
): Promise<IJobQuestion> => {
  const question = await loadQuestionOrThrow(questionId);
  const job = await loadJobOrThrow(question.job_id);
  await assertCanManageQuestionJob(user, job);
  await assertFormUnlocked(question.job_id);

  // Changing the type must keep the options rule consistent.
  const newType = updates.question_type ?? question.question_type;
  if (updates.question_type && updates.question_type !== question.question_type) {
    const optionCount = await questionOptionRepository.countByQuestion(questionId);
    assertOptionsMatchType(newType, optionCount);
  }

  const updated = await jobQuestionRepository.update(questionId, updates);
  if (!updated) throw AppError.notFound('Question not found');
  return updated;
};

/** Delete a question and its options (locked once applied). */
export const deleteQuestion = async (
  user: IAuthUser,
  questionId: string,
): Promise<void> => {
  const question = await loadQuestionOrThrow(questionId);
  const job = await loadJobOrThrow(question.job_id);
  await assertCanManageQuestionJob(user, job);
  await assertFormUnlocked(question.job_id);

  await questionOptionRepository.destroyByQuestion(questionId);
  await jobQuestionRepository.destroy(questionId);

  await recordAuditForUser(user, {
    action: 'JOB_QUESTION_DELETED',
    entity_type: 'JOB',
    entity_id: question.job_id,
    old_values: { question_id: questionId },
  });
};

// ---- Options --------------------------------------------------------------

/** Replace a question's option set (choice questions only). */
export const setOptions = async (
  user: IAuthUser,
  questionId: string,
  optionTexts: string[],
): Promise<IQuestionOption[]> => {
  const question = await loadQuestionOrThrow(questionId);
  const job = await loadJobOrThrow(question.job_id);
  await assertCanManageQuestionJob(user, job);
  await assertFormUnlocked(question.job_id);

  const needsOptions = QUESTION_TYPES_REQUIRING_OPTIONS.includes(question.question_type);
  if (!needsOptions && optionTexts.length > 0) {
    throw AppError.badRequest(`${question.question_type} questions cannot have options`);
  }
  if (needsOptions && optionTexts.length < 1) {
    throw AppError.badRequest(`${question.question_type} questions require at least one option`);
  }

  // Reject duplicates within the payload.
  const normalized = optionTexts.map((t) => t.trim()).filter(Boolean);
  if (new Set(normalized).size !== normalized.length) {
    throw AppError.badRequest('Duplicate option values are not allowed');
  }

  await questionOptionRepository.destroyByQuestion(questionId);
  const created: IQuestionOption[] = [];
  for (let i = 0; i < normalized.length; i += 1) {
    created.push(
      await questionOptionRepository.create({
        question_id: questionId,
        option_text: normalized[i],
        position: i,
      }),
    );
  }
  return created;
};

/** Options for a single question. */
export const listOptions = async (
  user: IAuthUser,
  questionId: string,
): Promise<IQuestionOption[]> => {
  const question = await loadQuestionOrThrow(questionId);
  const job = await loadJobOrThrow(question.job_id);
  await assertCanManageQuestionJob(user, job);
  return questionOptionRepository.listByQuestion(questionId);
};

export const jobQuestionServices = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  setOptions,
  listOptions,
  assertFormUnlocked,
};

export default jobQuestionServices;
