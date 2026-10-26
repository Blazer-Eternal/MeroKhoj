import { AppError } from '../utils';
import { IInterview, IInterviewCreation, IInterviewUpdate } from '../interfaces';
import { InterviewStatus, INTERVIEW_STATUS_TRANSITIONS } from '../enums';
import { interviewRepository, applicationRepository } from '../repositories';
import { assertCanManageJobs, assertCanAccessApplication, isPlatformAdmin } from './accessControl';
import { IAuthUser } from '../interfaces';

/**
 * Interview business logic.
 *
 * Key rule from the spec: cancelling an interview must NOT automatically reject
 * the application. Interview state and application state are independent.
 */
export const scheduleInterview = async (
  actor: IAuthUser,
  input: Omit<IInterviewCreation, 'scheduled_by' | 'status'>,
): Promise<IInterview> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(input.application_id);
  if (!application) throw AppError.notFound('Application not found');

  const job = application.job as { company_id?: string } | undefined;
  if (job?.company_id) {
    await assertCanManageJobs(actor, job.company_id);
  } else if (!isPlatformAdmin(actor)) {
    throw AppError.forbidden('You are not authorized to schedule interviews for this application');
  }

  return interviewRepository.create({
    ...input,
    scheduled_by: actor.id,
    status: InterviewStatus.SCHEDULED,
  });
};

export const getInterview = async (
  user: IAuthUser,
  interviewId: string,
): Promise<IInterview> => {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw AppError.notFound('Interview not found');

  const application = await applicationRepository.findByIdWithJobAndJobseeker(
    interview.application_id,
  );
  if (application) await assertCanAccessApplication(user, application);
  return interview;
};

/** Update interview details (time, type, notes). */
export const updateInterview = async (
  actor: IAuthUser,
  interviewId: string,
  updates: IInterviewUpdate,
): Promise<IInterview> => {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw AppError.notFound('Interview not found');
  await assertInterviewManageable(actor, interview.application_id);

  const updated = await interviewRepository.update(interviewId, updates);
  if (!updated) throw AppError.notFound('Interview not found');
  return updated;
};

/**
 * Transition an interview's status (confirm, complete, cancel, reschedule, no-show).
 * Enforces INTERVIEW_STATUS_TRANSITIONS.
 */
export const changeInterviewStatus = async (
  actor: IAuthUser,
  interviewId: string,
  newStatus: InterviewStatus,
): Promise<IInterview> => {
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw AppError.notFound('Interview not found');
  await assertInterviewManageable(actor, interview.application_id);

  const allowed = INTERVIEW_STATUS_TRANSITIONS[interview.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw AppError.conflict(`Cannot move interview from ${interview.status} to ${newStatus}`);
  }

  const updated = await interviewRepository.update(interviewId, { status: newStatus });
  if (!updated) throw AppError.notFound('Interview not found');
  return updated;
};

/** All interviews for one application. */
export const listInterviewsForApplication = async (
  user: IAuthUser,
  applicationId: string,
): Promise<IInterview[]> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');
  await assertCanAccessApplication(user, application);
  return interviewRepository.listByApplication(applicationId);
};

/** Upcoming interviews across a company's jobs (recruiter dashboard). */
export const listUpcomingForCompany = async (
  user: IAuthUser,
  companyId: string,
  limit?: number,
): Promise<IInterview[]> => {
  await assertCanManageJobs(user, companyId);
  return interviewRepository.listUpcomingByCompany(companyId, limit);
};

/** The applicant or an employer member of the job's company may manage. */
const assertInterviewManageable = async (user: IAuthUser, applicationId: string): Promise<void> => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');

  if (application.jobseeker_id === user.id) return; // applicant can view/update confirm

  const job = application.job as { company_id?: string } | undefined;
  if (job?.company_id) {
    await assertCanManageJobs(user, job.company_id);
  } else if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('You are not authorized to manage this interview');
  }
};

export const interviewServices = {
  scheduleInterview,
  getInterview,
  updateInterview,
  changeInterviewStatus,
  listInterviewsForApplication,
  listUpcomingForCompany,
};

export default interviewServices;
