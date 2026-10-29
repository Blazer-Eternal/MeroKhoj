import Report from '../models/reportModel';
import { IReport, IReportCreation } from '../interfaces';
import { ReportEntityType, ReportStatus } from '../enums';
import { plain } from '../utils';
import { Op } from 'sequelize';

/** Data-access layer for the `reports` table. */
class ReportRepository {
  async findById(id: string): Promise<IReport | null> {
    const row = await Report.findByPk(id);
    return row ? (plain(row) as IReport) : null;
  }

  async create(payload: IReportCreation): Promise<IReport> {
    const row = await Report.create(payload);
    return plain(row) as IReport;
  }

  async update(id: string, updates: Partial<IReport>): Promise<IReport | null> {
    const row = await Report.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IReport;
  }

  /**
   * Has this user already filed an OPEN report against this entity?
   * Used to prevent duplicate active reports on the same target.
   */
  async hasOpenReport(
    reporterId: string,
    entityType: ReportEntityType,
    entityId: string,
  ): Promise<boolean> {
    const count = await Report.count({
      where: {
        reported_by: reporterId,
        entity_type: entityType,
        entity_id: entityId,
        status: { [Op.in]: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW] },
      },
    });
    return count > 0;
  }

  /** List reports with optional status filter, newest first. */
  async list(status: ReportStatus | undefined): Promise<IReport[]> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const rows = await Report.findAll({ where, order: [['created_at', 'DESC']] });
    return plain<IReport[]>(rows as unknown as Record<string, unknown>[]);
  }
}

export default new ReportRepository();
