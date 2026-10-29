import { AppError } from '../utils';
import { IReport, IReportCreation, IReportResolution, IAuthUser } from '../interfaces';
import {
  ReportEntityType,
  ReportStatus,
  REPORT_STATUS_TRANSITIONS,
  REPORT_TERMINAL_STATUSES,
} from '../enums';
import { reportRepository, userRepository, companyRepository, jobRepository } from '../repositories';
import { isPlatformAdmin } from './accessControl';
import { recordAuditForUser } from './auditLogServices';

/**
 * Reports service — users report abusive/inappropriate USER, COMPANY or JOB
 * content; admins/moderators triage and resolve them.
 *
 * Because `entity_id` is polymorphic, we validate at the application layer
 * that the referenced entity actually exists for the given entity_type.
 */

const REPORTABLE: Record<ReportEntityType, (id: string) => Promise<unknown>> = {
  [ReportEntityType.USER]: (id) => userRepository.findById(id),
  [ReportEntityType.COMPANY]: (id) => companyRepository.findById(id),
  [ReportEntityType.JOB]: (id) => jobRepository.findById(id),
};

/** File a new report (any authenticated user). */
export const createReport = async (
  user: IAuthUser,
  input: Omit<IReportCreation, 'reported_by' | 'status' | 'resolved_by' | 'resolved_at'>,
): Promise<IReport> => {
  // Validate the reported entity exists.
  const exists = await REPORTABLE[input.entity_type](input.entity_id);
  if (!exists) {
    throw AppError.notFound(`Reported ${input.entity_type} not found`);
  }

  // Prevent duplicate active reports by the same user on the same target.
  if (await reportRepository.hasOpenReport(user.id, input.entity_type, input.entity_id)) {
    throw AppError.conflict('You have already reported this item');
  }

  const report = await reportRepository.create({
    ...input,
    reported_by: user.id,
    status: ReportStatus.OPEN,
  });

  await recordAuditForUser(user, {
    action: 'REPORT_CREATED',
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    new_values: { report_id: report.id, reason: input.reason },
  });

  return report;
};

/** Move a report through its status workflow (admin/moderator only). */
export const changeReportStatus = async (
  user: IAuthUser,
  reportId: string,
  newStatus: ReportStatus,
  reason?: string,
): Promise<IReport> => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only moderators can manage reports');
  }

  const report = await reportRepository.findById(reportId);
  if (!report) throw AppError.notFound('Report not found');

  const allowed = REPORT_STATUS_TRANSITIONS[report.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw AppError.conflict(`Cannot move report from ${report.status} to ${newStatus}`);
  }

  const updates: Partial<IReport> = { status: newStatus };
  if (REPORT_TERMINAL_STATUSES.includes(newStatus)) {
    updates.resolved_by = user.id;
    updates.resolved_at = new Date();
  }

  const updated = await reportRepository.update(reportId, updates);
  if (!updated) throw AppError.notFound('Report not found');

  await recordAuditForUser(user, {
    action: `REPORT_${newStatus}`,
    entity_type: 'REPORT',
    entity_id: reportId,
    old_values: { status: report.status },
    new_values: { status: newStatus, reason: reason ?? null },
  });

  return updated;
};

/** Resolve/dismiss shorthand (terminal states). */
export const resolveReport = async (
  user: IAuthUser,
  reportId: string,
  resolution: IReportResolution,
): Promise<IReport> => changeReportStatus(user, reportId, resolution.status);

/** List reports (admin/moderator only), optionally filtered by status. */
export const listReports = async (
  user: IAuthUser,
  status?: ReportStatus,
): Promise<IReport[]> => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only moderators can view reports');
  }
  return reportRepository.list(status);
};

/** Fetch a single report (admin or the original reporter). */
export const getReport = async (user: IAuthUser, reportId: string): Promise<IReport> => {
  const report = await reportRepository.findById(reportId);
  if (!report) throw AppError.notFound('Report not found');
  if (report.reported_by !== user.id && !isPlatformAdmin(user)) {
    throw AppError.forbidden('You are not authorized to view this report');
  }
  return report;
};

export const reportServices = {
  createReport,
  changeReportStatus,
  resolveReport,
  listReports,
  getReport,
};

export default reportServices;
