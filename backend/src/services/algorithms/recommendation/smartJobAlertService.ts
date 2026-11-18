import { IJob, IJobAlert } from '../../../interfaces';
import { JobAlertFrequency, NotificationType } from '../../../enums';
import { jobAlertRepository, jobRepository, jobSkillRepository } from '../../../repositories';
import { notify } from '../../notification/notificationServices';
import {
  ICandidateSignals,
  loadSignalsForUser,
} from '../matching/jobMatchingService';
import { PROFILE_FIT_THRESHOLD, scoreJobsForCandidate } from '../matching/candidateMatchingService';

/**
 * Smart job alerts (Phase 1 algorithm).
 *
 * Three upgrades over plain saved-search matching:
 *
 * 1. Keyword terms are OR'd word-by-word against title+description, so a saved
 *    search like "react typescript frontend" matches a React job instead of
 *    requiring that exact phrase.
 * 2. Every candidate/job pair gets the same 0-100 match score used by the
 *    recruiter pipeline, and matches come back ranked by it. Alerts with NO
 *    explicit filters are treated as a profile-fit screen and only pass above
 *    PROFILE_FIT_THRESHOLD.
 * 3. Frequency gating: DAILY/WEEKLY alerts only dispatch once their window has
 *    elapsed since last_sent_at, and last_sent_at is stamped ONLY when there
 *    were matches — otherwise a quiet day would silently consume the window.
 *
 * `isAlertDue` is pure so the window logic is testable without the DB.
 */

/** Upper bound on matches reported per alert (notification payload size). */
export const MAX_ALERT_MATCHES = 50;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export interface IAlertMatch {
  id: string;
  title: string;
  score: number;
  published_at: Date | null;
}

/** Does the alert pin down specific criteria (vs. an open profile-fit feed)? */
export const hasExplicitFilters = (alert: IJobAlert): boolean =>
  Boolean(
    (alert.keywords && alert.keywords.trim()) ||
      alert.category_id ||
      alert.location_id ||
      alert.employment_type,
  );

/**
 * Is this alert due for evaluation at `now`?
 * INSTANT is always due; DAILY needs 24h; WEEKLY needs 7d since the last send.
 * A never-sent alert is always due.
 */
export const isAlertDue = (
  frequency: JobAlertFrequency,
  lastSentAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean => {
  if (frequency === JobAlertFrequency.INSTANT) return true;
  if (!lastSentAt) return true;

  const last = new Date(lastSentAt).getTime();
  if (Number.isNaN(last)) return true;

  const age = now.getTime() - last;
  if (frequency === JobAlertFrequency.DAILY) return age >= DAY_MS;
  if (frequency === JobAlertFrequency.WEEKLY) return age >= WEEK_MS;
  return false;
};

/** Split an alert's keyword string into individual search terms. */
const alertTerms = (alert: IJobAlert): string[] =>
  (alert.keywords ?? '')
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter(Boolean);

/** Pure filter check: does this single job satisfy the alert's criteria? */
export const jobMatchesAlertFilters = (job: IJob, alert: IJobAlert): boolean => {
  if (alert.category_id && job.category_id !== alert.category_id) return false;
  if (alert.location_id && job.location_id !== alert.location_id) return false;
  if (alert.employment_type && job.employment_type !== alert.employment_type) return false;

  const terms = alertTerms(alert).map((term) => term.toLowerCase());
  if (terms.length > 0) {
    const haystack = `${job.title}\n${job.description}`.toLowerCase();
    if (!terms.some((term) => haystack.includes(term))) return false;
  }
  return true;
};

/** Score + rank candidate jobs for the alert's owner (shared match scorer). */
const rankJobsFor = async (
  jobs: IJob[],
  signals: ICandidateSignals | null,
): Promise<IAlertMatch[]> => {
  if (!signals) return [];
  const skillsByJob = await jobSkillRepository.mapByJobIds(jobs.map((job) => job.id));
  return scoreJobsForCandidate(jobs, skillsByJob, signals).map((match) => ({
    id: match.job.id,
    title: match.job.title,
    score: match.score,
    published_at: match.job.published_at,
  }));
};

/**
 * Find + rank jobs matching an alert, published after `last_sent_at`.
 * Filter-less alerts additionally require a profile-fit score above threshold.
 */
export const findMatches = async (alert: IJobAlert): Promise<IAlertMatch[]> => {
  const jobs = await jobRepository.findPublishedMatching({
    terms: alertTerms(alert),
    category_id: alert.category_id,
    location_id: alert.location_id,
    employment_type: alert.employment_type,
    since: alert.last_sent_at ? new Date(alert.last_sent_at) : null,
  });
  if (jobs.length === 0) return [];

  const signals = await loadSignalsForUser(alert.user_id);
  const explicitFilters = hasExplicitFilters(alert);
  if (!explicitFilters && !signals) return []; // no profile → no profile-fit

  const ranked = await rankJobsFor(jobs, signals);

  const matches = explicitFilters
    ? ranked
    : ranked.filter((match) => match.score >= PROFILE_FIT_THRESHOLD);

  return matches.slice(0, MAX_ALERT_MATCHES);
};

/**
 * Dispatch one alert: notify the owner of ranked matches and stamp
 * `last_sent_at` ONLY when something was sent (so a quiet window does not
 * reset the clock). Returns the number of matches dispatched.
 */
export const dispatchAlert = async (alert: IJobAlert): Promise<number> => {
  const matches = await findMatches(alert);
  if (matches.length === 0) return 0;

  const titles = matches.slice(0, 5).map((match) => match.title).join(', ');
  const suffix = matches.length > 5 ? ` (+${matches.length - 5} more)` : '';
  await notify(
    alert.user_id,
    NotificationType.JOB_ALERT,
    `New jobs matching "${alert.name}"`,
    `${matches.length} new job(s): ${titles}${suffix}`,
    { alert_id: alert.id, job_ids: matches.map((match) => match.id) },
  );
  await jobAlertRepository.markSent(alert.id, new Date());
  return matches.length;
};

/** Worker entry point: dispatch only the alerts whose frequency window elapsed. */
export const dispatchDueAlerts = async (
  options: { onlyAlertIds?: string[] } = {},
): Promise<number> => {
  const alerts = await jobAlertRepository.listActive();
  const only = options.onlyAlertIds ? new Set(options.onlyAlertIds) : null;
  let dispatched = 0;

  for (const alert of alerts) {
    if (only && !only.has(alert.id)) continue;
    if (!isAlertDue(alert.frequency, alert.last_sent_at)) continue;
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

/**
 * On-publish hook: immediately notify INSTANT alerts whose filters accept the
 * new job (and, for filter-less alerts, whose profile fit clears the
 * threshold). Called by changeJobStatus on first publish.
 */
export const notifyInstantAlerts = async (job: IJob): Promise<number> => {
  const alerts = await jobAlertRepository.listActive();
  const instant = alerts.filter(
    (alert) => alert.frequency === JobAlertFrequency.INSTANT && alert.is_active,
  );
  if (instant.length === 0) return 0;

  const skills = (await jobSkillRepository.mapByJobIds([job.id])).get(job.id) ?? [];
  const signalsByUser = new Map<string, ICandidateSignals | null>();
  let notified = 0;

  for (const alert of instant) {
    if (!jobMatchesAlertFilters(job, alert)) continue;

    if (!signalsByUser.has(alert.user_id)) {
      signalsByUser.set(alert.user_id, await loadSignalsForUser(alert.user_id));
    }
    const signals = signalsByUser.get(alert.user_id) ?? null;
    const explicitFilters = hasExplicitFilters(alert);

    let score = 0;
    if (signals) {
      const [ranked] = scoreJobsForCandidate([job], new Map([[job.id, skills]]), signals);
      score = ranked?.score ?? 0;
    }
    if (!explicitFilters && (!signals || score < PROFILE_FIT_THRESHOLD)) continue;

    await notify(
      alert.user_id,
      NotificationType.JOB_ALERT,
      `New job matching "${alert.name}"`,
      job.title,
      { alert_id: alert.id, job_ids: [job.id], score },
    );
    await jobAlertRepository.markSent(alert.id, new Date());
    notified += 1;
  }
  return notified;
};

export const smartJobAlertService = {
  MAX_ALERT_MATCHES,
  hasExplicitFilters,
  isAlertDue,
  jobMatchesAlertFilters,
  findMatches,
  dispatchAlert,
  dispatchDueAlerts,
  notifyInstantAlerts,
};

export default smartJobAlertService;
