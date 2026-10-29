import { AppError, slugify, ensureUniqueSlug } from '../utils';
import { IIndustry, IIndustryCreation, IIndustryUpdate } from '../interfaces';
import { CatalogStatus } from '../enums';
import { industryRepository } from '../repositories';

/** Industry business logic. Names and slugs are unique. */

export const listIndustries = async (status?: CatalogStatus): Promise<IIndustry[]> =>
  industryRepository.listAll(status);

export const getIndustryById = async (id: string): Promise<IIndustry> => {
  const industry = await industryRepository.findById(id);
  if (!industry) throw AppError.notFound('Industry not found');
  return industry;
};

export const createIndustry = async (
  input: Omit<IIndustryCreation, 'slug'>,
): Promise<IIndustry> => {
  if (await industryRepository.nameExists(input.name)) {
    throw AppError.conflict(`An industry named "${input.name}" already exists`);
  }

  const baseSlug = slugify(input.name);
  const slug = await ensureUniqueSlug(baseSlug, (candidate) =>
    industryRepository.slugExists(candidate),
  );

  return industryRepository.create({
    ...input,
    slug,
    status: input.status ?? CatalogStatus.ACTIVE,
  });
};

export const updateIndustry = async (
  id: string,
  updates: IIndustryUpdate,
): Promise<IIndustry> => {
  const existing = await industryRepository.findById(id);
  if (!existing) throw AppError.notFound('Industry not found');

  if (updates.name && updates.name !== existing.name) {
    if (await industryRepository.nameExists(updates.name)) {
      throw AppError.conflict(`An industry named "${updates.name}" already exists`);
    }
  }

  const updated = await industryRepository.update(id, updates);
  if (!updated) throw AppError.notFound('Industry not found');
  return updated;
};

export const deleteIndustry = async (id: string): Promise<void> => {
  const existing = await industryRepository.findById(id);
  if (!existing) throw AppError.notFound('Industry not found');
  // FKs use SET NULL, so deletion is safe; it just unlinks referencing rows.
  await industryRepository.destroy(id);
};

export const industryServices = {
  listIndustries,
  getIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry,
};

export default industryServices;
