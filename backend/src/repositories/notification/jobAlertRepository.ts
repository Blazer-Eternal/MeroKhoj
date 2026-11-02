import JobAlert from '../../models/notification/jobAlertModel';
import { IJobAlert, IJobAlertCreation, IJobAlertUpdate } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `job_alerts` table. */
class JobAlertRepository {
  async findById(id: string): Promise<IJobAlert | null> {
    const row = await JobAlert.findByPk(id);
    return row ? (plain(row) as IJobAlert) : null;
  }

  async create(payload: IJobAlertCreation): Promise<IJobAlert> {
    const row = await JobAlert.create(payload);
    return plain(row) as IJobAlert;
  }

  async update(id: string, updates: IJobAlertUpdate): Promise<IJobAlert | null> {
    const row = await JobAlert.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IJobAlert;
  }

  async destroy(id: string): Promise<number> {
    return JobAlert.destroy({ where: { id } });
  }

  /** All alerts belonging to a user. */
  async listByUser(userId: string): Promise<IJobAlert[]> {
    const rows = await JobAlert.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    return plain<IJobAlert[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Active alerts — the candidate set for the dispatch worker. */
  async listActive(): Promise<IJobAlert[]> {
    const rows = await JobAlert.findAll({ where: { is_active: true } });
    return plain<IJobAlert[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Stamp last_sent_at after a successful dispatch. */
  async markSent(id: string, sentAt: Date): Promise<void> {
    await JobAlert.update({ last_sent_at: sentAt }, { where: { id } });
  }
}

export default new JobAlertRepository();
