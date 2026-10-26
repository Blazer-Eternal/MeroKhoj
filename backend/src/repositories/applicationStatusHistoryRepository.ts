import ApplicationStatusHistory from '../models/applicationStatusHistoryModel';
import {
  IApplicationStatusHistory,
  IApplicationStatusHistoryCreation,
} from '../interfaces';
import { plain } from '../utils';

/**
 * Data-access layer for `application_status_history` (append-only).
 *
 * The service layer is responsible for creating history rows atomically with
 * the status update; this repository only reads and inserts.
 */
class ApplicationStatusHistoryRepository {
  async create(
    payload: IApplicationStatusHistoryCreation,
  ): Promise<IApplicationStatusHistory> {
    const row = await ApplicationStatusHistory.create(payload);
    return plain(row) as IApplicationStatusHistory;
  }

  /** Full ordered transition log for an application (oldest first). */
  async listByApplication(applicationId: string): Promise<IApplicationStatusHistory[]> {
    const rows = await ApplicationStatusHistory.findAll({
      where: { application_id: applicationId },
      order: [['created_at', 'ASC']],
    });
    return plain<IApplicationStatusHistory[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** The most recent transition for an application. */
  async findLatestByApplication(
    applicationId: string,
  ): Promise<IApplicationStatusHistory | null> {
    const row = await ApplicationStatusHistory.findOne({
      where: { application_id: applicationId },
      order: [['created_at', 'DESC']],
    });
    return row ? (plain(row) as IApplicationStatusHistory) : null;
  }

  /** Find the first transition to a given status (for time-to-X analytics). */
  async findFirstTransitionTo(
    applicationId: string,
    status: string,
  ): Promise<IApplicationStatusHistory | null> {
    const row = await ApplicationStatusHistory.findOne({
      where: { application_id: applicationId, new_status: status },
      order: [['created_at', 'ASC']],
    });
    return row ? (plain(row) as IApplicationStatusHistory) : null;
  }
}

export default new ApplicationStatusHistoryRepository();
