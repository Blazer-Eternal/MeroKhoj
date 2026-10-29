import { ReportEntityType, ReportStatus } from '../enums';
import { ITimestamps } from './commonInterface';

/** A user-submitted report against a user, company or job. */
export interface IReport extends ITimestamps {
  id: string;
  reported_by: string;
  entity_type: ReportEntityType;
  entity_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: Date | null;
}

export interface IReportCreation {
  reported_by: string;
  entity_type: ReportEntityType;
  entity_id: string;
  reason: string;
  description?: string | null;
  status?: ReportStatus;
  resolved_by?: string | null;
  resolved_at?: Date | null;
}

export interface IReportResolution {
  status: ReportStatus; // RESOLVED or DISMISSED
  resolved_by: string;
}
