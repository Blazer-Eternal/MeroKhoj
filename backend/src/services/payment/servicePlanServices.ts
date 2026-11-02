import { AppError, getPaginationParams, IPaginationQuery, IPaginationMeta } from '../../utils';
import { IServicePlan, IServicePlanCreation, IAuthUser } from '../../interfaces';
import { CatalogStatus } from '../../enums';
import { servicePlanRepository, orderRepository } from '../../repositories';
import { isPlatformAdmin } from '../shared/accessControl';
import { recordAuditForUser } from '../administration/auditLogServices';

/**
 * Service plan catalog business logic (entity 33).
 *
 * Workflow rule 1: admin CRUD. Deactivating a plan is a status flip that
 * NEVER changes previously purchased orders (they hold their own
 * snapshots), and a plan can only be hard-deleted when no order ever
 * referenced it — otherwise the FK would orphan financial history (409).
 */

const assertAdmin = (user: IAuthUser): void => {
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('Only admins can manage service plans');
  }
};

/**
 * List plans. The public endpoint only ever sees ACTIVE plans; admins may
 * pass a status filter to review the full catalog.
 */
export const listPlans = async (
  user: IAuthUser | undefined,
  query: IPaginationQuery & { status?: CatalogStatus },
): Promise<{ data: IServicePlan[]; meta: IPaginationMeta }> => {
  const admin = user !== undefined && isPlatformAdmin(user);
  const status = admin ? (query.status as CatalogStatus | undefined) : CatalogStatus.ACTIVE;
  const pagination = getPaginationParams(query);
  return servicePlanRepository.list(status, pagination);
};

/** Get one plan; non-admins only ever see ACTIVE plans. */
export const getPlan = async (
  user: IAuthUser | undefined,
  id: string,
): Promise<IServicePlan> => {
  const plan = await servicePlanRepository.findById(id);
  if (!plan) throw AppError.notFound('Service plan not found');
  const admin = user !== undefined && isPlatformAdmin(user);
  if (!admin && plan.status !== CatalogStatus.ACTIVE) {
    throw AppError.notFound('Service plan not found');
  }
  return plan;
};

/** Create a plan (admin only). */
export const createPlan = async (
  user: IAuthUser,
  input: IServicePlanCreation,
): Promise<IServicePlan> => {
  assertAdmin(user);
  const plan = await servicePlanRepository.create(input);
  await recordAuditForUser(user, {
    action: 'SERVICE_PLAN_CREATED',
    entity_type: 'SERVICE_PLAN',
    entity_id: plan.id,
    new_values: { name: plan.name, price: plan.price, status: plan.status },
  });
  return plan;
};

/** Update a plan (admin only) — price changes only affect FUTURE orders. */
export const updatePlan = async (
  user: IAuthUser,
  id: string,
  updates: Partial<IServicePlan>,
): Promise<IServicePlan> => {
  assertAdmin(user);
  const existing = await servicePlanRepository.findById(id);
  if (!existing) throw AppError.notFound('Service plan not found');

  const plan = await servicePlanRepository.update(id, updates);
  if (!plan) throw AppError.notFound('Service plan not found');

  await recordAuditForUser(user, {
    action: 'SERVICE_PLAN_UPDATED',
    entity_type: 'SERVICE_PLAN',
    entity_id: id,
    old_values: { price: existing.price, status: existing.status },
    new_values: { price: plan.price, status: plan.status },
  });
  return plan;
};

/**
 * Deactivate instead of delete when the plan has been ordered. Hard delete
 * is only allowed for plans that were never purchased (history preserved).
 */
export const deletePlan = async (user: IAuthUser, id: string): Promise<void> => {
  assertAdmin(user);
  const plan = await servicePlanRepository.findById(id);
  if (!plan) throw AppError.notFound('Service plan not found');

  const orderCount = await orderRepository.countByPlan(id);
  if (orderCount > 0) {
    throw AppError.conflict(
      `Plan is referenced by ${orderCount} order(s) — deactivate it instead of deleting`,
    );
  }

  await servicePlanRepository.destroy(id);
  await recordAuditForUser(user, {
    action: 'SERVICE_PLAN_DELETED',
    entity_type: 'SERVICE_PLAN',
    entity_id: id,
    old_values: { name: plan.name, price: plan.price },
  });
};

export const servicePlanServices = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};

export default servicePlanServices;
