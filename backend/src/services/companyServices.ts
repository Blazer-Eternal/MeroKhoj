import { AppError, slugify, ensureUniqueSlug } from '../utils';
import { ICompany, ICompanyCreation, ICompanyUpdate } from '../interfaces';
import { CompanyRole, CompanyMemberStatus } from '../enums';
import { companyRepository, companyMemberRepository } from '../repositories';
import { assertCanManageCompany } from './accessControl';
import { IAuthUser } from '../interfaces';

/**
 * Company business logic.
 *
 * Creating a company automatically makes the creator its OWNER. Company slug is
 * generated from the name and guaranteed unique.
 */
export const createCompany = async (
  user: IAuthUser,
  input: Omit<ICompanyCreation, 'slug'>,
): Promise<ICompany> => {
  const baseSlug = slugify(input.name);
  const slug = await ensureUniqueSlug(baseSlug, (candidate) =>
    companyRepository.slugExists(candidate),
  );

  const company = await companyRepository.create({ ...input, slug });

  // The creator becomes the OWNER and an ACTIVE member.
  await companyMemberRepository.create({
    company_id: company.id,
    user_id: user.id,
    role: CompanyRole.OWNER,
    status: CompanyMemberStatus.ACTIVE,
    joined_at: new Date(),
  });

  return company;
};

export const getCompanyById = async (id: string): Promise<ICompany> => {
  const company = await companyRepository.findById(id);
  if (!company) throw AppError.notFound('Company not found');
  return company;
};

export const getCompanyBySlug = async (slug: string): Promise<ICompany> => {
  const company = await companyRepository.findBySlug(slug);
  if (!company) throw AppError.notFound('Company not found');
  return company;
};

/** Update company details — requires management rights within the company. */
export const updateCompany = async (
  user: IAuthUser,
  companyId: string,
  updates: ICompanyUpdate,
): Promise<ICompany> => {
  await assertCanManageCompany(user, companyId);
  const company = await companyRepository.update(companyId, updates);
  if (!company) throw AppError.notFound('Company not found');
  return company;
};

export const companyServices = { createCompany, getCompanyById, getCompanyBySlug, updateCompany };

export default companyServices;
