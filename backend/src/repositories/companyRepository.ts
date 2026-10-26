import Company from '../models/companyModel';
import { ICompany, ICompanyCreation } from '../interfaces';
import { CompanyStatus, CompanyVerificationStatus } from '../enums';
import { plain } from '../utils';

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
