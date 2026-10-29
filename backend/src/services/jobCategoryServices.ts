import { AppError, slugify, ensureUniqueSlug } from '../utils';
import {
  IJobCategory,
  IJobCategoryCreation,
  IJobCategoryUpdate,
  IJobCategoryTreeNode,
} from '../interfaces';
import { CatalogStatus } from '../enums';
import { jobCategoryRepository } from '../repositories';

/**
 * Job category business logic.
 *
 * Hierarchy rules:
 *   - A category cannot be its own parent.
 *   - Setting a parent must not create a cycle (we walk the ancestor chain of
 *     the proposed parent and reject if it contains the category itself).
 *   - Depth is capped to keep the tree shallow and queryable.
 */
const MAX_CATEGORY_DEPTH = 5;

export const listCategories = async (status?: CatalogStatus): Promise<IJobCategory[]> =>
  jobCategoryRepository.listAll(status);

/** Build the full nested category tree (roots with children attached). */
export const getCategoryTree = async (status?: CatalogStatus): Promise<IJobCategoryTreeNode[]> => {
  const all = await jobCategoryRepository.listAll(status);
  const byId = new Map<string, IJobCategoryTreeNode>();
  for (const cat of all) {
    byId.set(cat.id, { ...cat, children: [] });
  }

  const roots: IJobCategoryTreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

export const getCategoryById = async (id: string): Promise<IJobCategory> => {
  const category = await jobCategoryRepository.findById(id);
  if (!category) throw AppError.notFound('Job category not found');
  return category;
};

/** Validate that a proposed parent does not create a cycle or exceed depth. */
const assertValidParent = async (categoryId: string | null, parentId: string | null): Promise<void> => {
  if (!parentId) return;
  if (categoryId && parentId === categoryId) {
    throw AppError.badRequest('A category cannot be its own parent');
  }

  // Walk up from the proposed parent; if we encounter categoryId, it's a cycle.
  let current = await jobCategoryRepository.findById(parentId);
  if (!current) throw AppError.notFound('Parent category not found');

  let depth = 1;
  while (current) {
    if (categoryId && current.id === categoryId) {
      throw AppError.badRequest('Setting this parent would create a circular hierarchy');
    }
    if (!current.parent_id) break;
    current = await jobCategoryRepository.findById(current.parent_id);
    depth += 1;
    if (depth > MAX_CATEGORY_DEPTH) {
      throw AppError.badRequest(`Category hierarchy depth exceeds ${MAX_CATEGORY_DEPTH}`);
    }
  }
};

export const createCategory = async (
  input: Omit<IJobCategoryCreation, 'slug'>,
): Promise<IJobCategory> => {
  await assertValidParent(null, input.parent_id ?? null);

  const baseSlug = slugify(input.name);
  const slug = await ensureUniqueSlug(baseSlug, (candidate) =>
    jobCategoryRepository.slugExists(candidate),
  );

  return jobCategoryRepository.create({
    ...input,
    slug,
    status: input.status ?? CatalogStatus.ACTIVE,
  });
};

export const updateCategory = async (
  id: string,
  updates: IJobCategoryUpdate,
): Promise<IJobCategory> => {
  const existing = await jobCategoryRepository.findById(id);
  if (!existing) throw AppError.notFound('Job category not found');

  if (updates.parent_id !== undefined) {
    await assertValidParent(id, updates.parent_id);
  }

  const updated = await jobCategoryRepository.update(id, updates);
  if (!updated) throw AppError.notFound('Job category not found');
  return updated;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const existing = await jobCategoryRepository.findById(id);
  if (!existing) throw AppError.notFound('Job category not found');

  // Only allow deleting leaf categories to avoid orphaning children.
  const children = await jobCategoryRepository.listByParent(id);
  if (children.length > 0) {
    throw AppError.conflict('Cannot delete a category that has subcategories');
  }
  await jobCategoryRepository.destroy(id);
};

export const jobCategoryServices = {
  listCategories,
  getCategoryTree,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default jobCategoryServices;
