import { Op } from 'sequelize';

import Company from '../../models/company/companyModel';
import { ICompany, ICompanyCreation } from '../../interfaces';
import { CompanyStatus, CompanyVerificationStatus } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta } from '../../utils';

/** Data-access layer for the `companies` table. */
class CompanyRepository {
  async findById(id: string): Promise<ICompany | null> {
    const company = await Company.findByPk(id);
    return company ? (plain(company) as ICompany) : null;
  }

  async findBySlug(slug: string): Promise<ICompany | null> {
    const company = await Company.findOne({ where: { slug } });
    return company ? (plain(company) as ICompany) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await Company.count({ where: { slug } });
    return count > 0;
  }

  /**
   * Paginated company directory listing.
   * `filters` are pre-normalized in the service (anonymous callers are forced
   * to ACTIVE+VERIFIED); `pagination` comes from getPaginationParams.
   */
  async list(
    filters: {
      name?: string;
      status?: CompanyStatus;
      verification_status?: CompanyVerificationStatus;
    },
    pagination: IPaginationParams,
  ): Promise<{ data: ICompany[]; meta: ReturnType<typeof buildPaginationMeta> }> {
    const where: Record<string, unknown> = {};
    if (filters.name) where.name = { [Op.iLike]: `%${filters.name}%` };
    if (filters.status) where.status = filters.status;
    if (filters.verification_status) where.verification_status = filters.verification_status;

    const { rows, count } = await Company.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows.map((row) => plain(row) as ICompany),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  async create(payload: ICompanyCreation): Promise<ICompany> {
    const company = await Company.create(payload);
    return plain(company) as ICompany;
  }

  async update(id: string, updates: Partial<ICompany>): Promise<ICompany | null> {
    const company = await Company.findByPk(id);
    if (!company) return null;
    await company.update(updates);
    return plain(company) as ICompany;
  }

  async setVerificationStatus(
    id: string,
    verification_status: CompanyVerificationStatus,
  ): Promise<void> {
    await Company.update({ verification_status }, { where: { id } });
  }

  async setStatus(id: string, status: CompanyStatus): Promise<void> {
    await Company.update({ status }, { where: { id } });
  }
}

export default new CompanyRepository();
