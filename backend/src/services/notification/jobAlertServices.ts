import { AppError } from '../../utils';
import { IJobAlert, IJobAlertCreation, IJobAlertUpdate, IAuthUser } from '../../interfaces';
import { JobAlertFrequency } from '../../enums';
import {
  jobAlertRepository,
  jobCategoryRepository,
  locationRepository,
} from '../../repositories';
// Phase 1: matching/dispatch logic lives in the recommendation service so the
// same scoring is shared with the recruiter-facing match score.
import {
  dispatchAlert,
  dispatchDueAlerts,
  findMatches,
} from '../algorithms/recommendation/smartJobAlertService';

/**
 * Job alerts ("saved searches") business logic.
 *
 * An alert stores a set of filters (keywords + optional category/location/
 * employment type). Matching, ranking and frequency-gated dispatch are
 * delegated to `smartJobAlertService`; this module owns CRUD + validation.
 */

/** Validate that referenced classification ids exist. */
const assertFiltersExist = async (input: {
  category_id?: string | null;
  location_id?: string | null;
}): Promise<void> => {
  if (input.category_id) {
    const category = await jobCategoryRepository.findById(input.category_id);
    if (!category) throw AppError.badRequest('Category not found');
  }
  if (input.location_id) {
    const location = await locationRepository.findById(input.location_id);
    if (!location) throw AppError.badRequest('Location not found');
  }
};

export const createJobAlert = async (
  user: IAuthUser,
  input: Omit<IJobAlertCreation, 'user_id'>,
): Promise<IJobAlert> => {
  await assertFiltersExist(input);
  return jobAlertRepository.create({ ...input, user_id: user.id });
};

export const updateJobAlert = async (
  user: IAuthUser,
  id: string,
  updates: IJobAlertUpdate,
): Promise<IJobAlert> => {
  const alert = await jobAlertRepository.findById(id);
  if (!alert) throw AppError.notFound('Job alert not found');
  if (alert.user_id !== user.id) {
    throw AppError.forbidden('You can only edit your own job alerts');
  }
  await assertFiltersExist(updates);

  const updated = await jobAlertRepository.update(id, updates);
  if (!updated) throw AppError.notFound('Job alert not found');
  return updated;
};

export const deleteJobAlert = async (user: IAuthUser, id: string): Promise<void> => {
  const alert = await jobAlertRepository.findById(id);
  if (!alert) throw AppError.notFound('Job alert not found');
  if (alert.user_id !== user.id) {
    throw AppError.forbidden('You can only delete your own job alerts');
  }
  await jobAlertRepository.destroy(id);
};

export const listJobAlerts = async (user: IAuthUser): Promise<IJobAlert[]> =>
  jobAlertRepository.listByUser(user.id);

export const getJobAlert = async (user: IAuthUser, id: string): Promise<IJobAlert> => {
  const alert = await jobAlertRepository.findById(id);
  if (!alert) throw AppError.notFound('Job alert not found');
  if (alert.user_id !== user.id) {
    throw AppError.forbidden('You can only view your own job alerts');
  }
  return alert;
};

/**
 * Matching + dispatch are delegated to the smart job-alert algorithm
 * (keyword OR-matching, profile-fit threshold, match-score ranking and
 * frequency-window gating). See services/algorithms/recommendation.
 */

/** Human-readable description of an alert's frequency. */
export const describeFrequency = (frequency: JobAlertFrequency): string => {
  switch (frequency) {
    case JobAlertFrequency.INSTANT:
      return 'as soon as jobs are posted';
    case JobAlertFrequency.WEEKLY:
      return 'once a week';
    case JobAlertFrequency.DAILY:
    default:
      return 'once a day';
  }
};

export const jobAlertServices = {
  createJobAlert,
  updateJobAlert,
  deleteJobAlert,
  listJobAlerts,
  getJobAlert,
  findMatches,
  dispatchAlert,
  dispatchDueAlerts,
  describeFrequency,
};

export default jobAlertServices;
