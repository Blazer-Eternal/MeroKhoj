import { AppError, getPaginationParams } from '../../utils';
import { IJobAlert, IJobAlertCreation, IJobAlertUpdate, IAuthUser } from '../../interfaces';
import { JobStatus, JobAlertFrequency, NotificationType } from '../../enums';
import {
  jobAlertRepository,
  jobRepository,
  jobCategoryRepository,
  locationRepository,
} from '../../repositories';
import { notify } from './notificationServices';

/**
 * Job alerts ("saved searches") business logic.
 *
 * An alert stores a set of filters (keywords + optional category/location/
 * employment type). The dispatch worker periodically matches each ACTIVE alert
 * against jobs published since the alert's `last_sent_at` and creates a
 * JOB_ALERT notification for the owner.
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
 * Find jobs matching an alert that were published after `last_sent_at`.
 * Uses the shared job search filters so alert matching stays consistent with
 * the public job search.
 */
export const findMatches = async (alert: IJobAlert): Promise<{ id: string; title: string }[]> => {
  const query: Record<string, unknown> = { status: JobStatus.PUBLISHED };
  if (alert.keywords) query.q = alert.keywords;
  if (alert.category_id) query.category_id = alert.category_id;
  if (alert.location_id) query.location_id = alert.location_id;
  if (alert.employment_type) query.employment_type = alert.employment_type;

  const { data } = await jobRepository.search(
    query as never,
    getPaginationParams({ page: 1, perPage: 50 }),
  );

  // Only jobs published since the last dispatch are "new" matches.
  const since = alert.last_sent_at ? new Date(alert.last_sent_at).getTime() : 0;
  return data
    .filter((job) => {
      const published = job.published_at ? new Date(job.published_at).getTime() : 0;
      return published > since;
    })
    .map((job) => ({ id: job.id, title: job.title }));
};

/**
 * Dispatch a single alert: notify the owner of new matches and stamp
 * last_sent_at. Returns the number of matches dispatched.
 */
export const dispatchAlert = async (alert: IJobAlert): Promise<number> => {
  const matches = await findMatches(alert);
  if (matches.length > 0) {
    const titles = matches.slice(0, 5).map((m) => m.title).join(', ');
    const suffix = matches.length > 5 ? ` (+${matches.length - 5} more)` : '';
    await notify(
      alert.user_id,
      NotificationType.JOB_ALERT,
      `New jobs matching "${alert.name}"`,
      `${matches.length} new job(s): ${titles}${suffix}`,
      { alert_id: alert.id, job_ids: matches.map((m) => m.id) },
    );
  }
  await jobAlertRepository.markSent(alert.id, new Date());
  return matches.length;
};

/** Run the dispatcher over every active alert. Called by the worker. */
export const dispatchDueAlerts = async (): Promise<number> => {
  const alerts = await jobAlertRepository.listActive();
  let dispatched = 0;
  for (const alert of alerts) {
    try {
      const count = await dispatchAlert(alert);
      if (count > 0) dispatched += 1;
    } catch (error) {
      // One bad alert must not break the whole run.
      console.error(`[job-alerts] failed to dispatch alert ${alert.id}:`, error);
    }
  }
  return dispatched;
};

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
