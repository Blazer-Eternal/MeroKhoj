import { Transaction } from 'sequelize';
import HiringDecision from '../models/hiringDecisionModel';
import { IHiringDecision, IHiringDecisionCreation } from '../interfaces';
import { plain } from '../utils';

/**
 * Data-access layer for the `hiring_decisions` table.
 * The unique constraint on application_id means at most one row per
 * application; upsertDecision() replaces it (the previous outcome is captured
 * in audit_logs by the service).
 */
class HiringDecisionRepository {
  async findById(id: string): Promise<IHiringDecision | null> {
    const row = await HiringDecision.findByPk(id);
    return row ? (plain(row) as IHiringDecision) : null;
  }

  /** The current decision for an application (null if none yet). */
  async findByApplication(applicationId: string): Promise<IHiringDecision | null> {
    const row = await HiringDecision.findOne({ where: { application_id: applicationId } });
    return row ? (plain(row) as IHiringDecision) : null;
  }

  async create(
    payload: IHiringDecisionCreation,
    options?: { transaction?: Transaction },
  ): Promise<IHiringDecision> {
    const row = await HiringDecision.create(payload, { transaction: options?.transaction });
    return plain(row) as IHiringDecision;
  }

  /** Replace the existing decision for an application (single row). */
  async update(
    applicationId: string,
    updates: Partial<IHiringDecision>,
    options?: { transaction?: Transaction },
  ): Promise<IHiringDecision | null> {
    const row = await HiringDecision.findOne({
      where: { application_id: applicationId },
      transaction: options?.transaction,
    });
    if (!row) return null;
    await row.update(updates, { transaction: options?.transaction });
    return plain(row) as IHiringDecision;
  }

  async destroy(id: string): Promise<number> {
    return HiringDecision.destroy({ where: { id } });
  }
}

export default new HiringDecisionRepository();
