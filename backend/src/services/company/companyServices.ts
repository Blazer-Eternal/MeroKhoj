import { AppError, slugify, ensureUniqueSlug, getPaginationParams, IPaginationQuery, IPaginationMeta } from '../../utils';
import {
  ICompany,
  ICompanyCreation,
  ICompanyUpdate,
  IAuthUser,
} from '../../interfaces';
import {
  CompanyRole,
  CompanyMemberStatus,
  CompanyStatus,
  CompanyVerificationStatus,
} from '../../enums';
import { companyRepository, companyMemberRepository } from '../../repositories';
import { assertCanManageCompany, isPlatformAdmin } from '../shared/accessControl';

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

/**
 * Public-safe company lookup: anonymous and non-admin callers only ever see
 * ACTIVE companies; admins/members can see the rest (suspended, etc.).
 * Non-ACTIVE companies are hidden as 404 so their existence isn't leaked.
 */
export const getCompanyByIdForUser = async (
  user: IAuthUser | undefined,
  id: string,
): Promise<ICompany> => {
  const company = await getCompanyById(id);
  const visible =
    company.status === CompanyStatus.ACTIVE ||
    (user !== undefined && isPlatformAdmin(user));
  if (!visible) throw AppError.notFound('Company not found');
  return company;
};

export const getCompanyBySlug = async (slug: string): Promise<ICompany> => {
  const company = await companyRepository.findBySlug(slug);
  if (!company) throw AppError.notFound('Company not found');
  return company;
};

/**
 * Company directory (public).
 *
 * Anonymous and non-admin callers only ever see ACTIVE + VERIFIED companies
 * (the public directory); admins may pass status/verification filters to
 * review the full catalog.
 */
export const listCompanies = async (
  user: IAuthUser | undefined,
  query: IPaginationQuery & {
    q?: string;
    status?: CompanyStatus;
    verification_status?: CompanyVerificationStatus;
  },
): Promise<{ data: ICompany[]; meta: IPaginationMeta }> => {
  const admin = user !== undefined && isPlatformAdmin(user);
  const filters = admin
    ? { name: query.q, status: query.status, verification_status: query.verification_status }
    : {
        name: query.q,
        status: CompanyStatus.ACTIVE,
        verification_status: CompanyVerificationStatus.VERIFIED,
      };
  const pagination = getPaginationParams(query);
  return companyRepository.list(filters, pagination);
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

export const companyServices = {
  createCompany,
  getCompanyById,
  getCompanyByIdForUser,
  getCompanyBySlug,
  listCompanies,
  updateCompany,
};

export default companyServices;
