import {
  buildAnalytics,
  IRecruitmentAnalytics,
} from './recruitmentAnalyticsService';

/**
 * Company recruitment analytics (Phase 1).
 *
 * Employer-scoped view of the pipeline: volume, funnel, conversion rates,
 * time-to-hire, source mix and per-job performance for ONE company.
 * Authorization (membership of `companyId`) is the controller's job — this
 * service assumes the caller already resolved the scope.
 */

export const getCompanyAnalytics = async (
  companyId: string,
): Promise<IRecruitmentAnalytics> => buildAnalytics('company', companyId);

export const companyAnalyticsService = { getCompanyAnalytics };

export default companyAnalyticsService;
