import CompanyVerification from '../models/companyVerificationModel';
import { ICompanyVerification, ICompanyVerificationCreation } from '../interfaces';
import { CompanyVerificationStatus } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `company_verifications` table. */
class CompanyVerificationRepository {
  async findById(id: string): Promise<ICompanyVerification | null> {
    const row = await CompanyVerification.findByPk(id);
    return row ? (plain(row) as ICompanyVerification) : null;
  }

  /** The most recent verification record for a company. */
  async findLatestByCompany(companyId: string): Promise<ICompanyVerification | null> {
    const row = await CompanyVerification.findOne({
      where: { company_id: companyId },
      order: [['submitted_at', 'DESC']],
    });
    return row ? (plain(row) as ICompanyVerification) : null;
  }

  /** Is there an already-open (PENDING) verification for this company? */
  async hasPending(companyId: string): Promise<boolean> {
    const count = await CompanyVerification.count({
      where: { company_id: companyId, status: CompanyVerificationStatus.PENDING },
    });
    return count > 0;
  }

  async listByCompany(companyId: string): Promise<ICompanyVerification[]> {
    const rows = await CompanyVerification.findAll({
      where: { company_id: companyId },
      order: [['submitted_at', 'DESC']],
    });
    return plain<ICompanyVerification[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** All pending verifications (admin review queue). */
  async listPending(): Promise<ICompanyVerification[]> {
    const rows = await CompanyVerification.findAll({
      where: { status: CompanyVerificationStatus.PENDING },
      order: [['submitted_at', 'ASC']],
    });
    return plain<ICompanyVerification[]>(rows as unknown as Record<string, unknown>[]);
  }

  async create(payload: ICompanyVerificationCreation): Promise<ICompanyVerification> {
    const row = await CompanyVerification.create(payload);
    return plain(row) as ICompanyVerification;
  }

  async update(
    id: string,
    updates: Partial<ICompanyVerification>,
  ): Promise<ICompanyVerification | null> {
    const row = await CompanyVerification.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as ICompanyVerification;
  }
}

export default new CompanyVerificationRepository();
