import ServicePlan from '../../models/payment/servicePlanModel';
import { IServicePlan, IServicePlanCreation } from '../../interfaces';
import { CatalogStatus } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta, toMoney } from '../../utils';

/** Map a row, coercing DECIMAL price to a JSON number. */
const mapPlan = (row: IServicePlan): IServicePlan => ({
  ...row,
  price: toMoney(row.price),
});

/** Data-access layer for the `service_plans` catalog (entity 33). */
class ServicePlanRepository {
  async findById(id: string): Promise<IServicePlan | null> {
    const row = await ServicePlan.findByPk(id);
    return row ? mapPlan(plain<IServicePlan>(row)) : null;
  }

  /**
   * List plans with optional status filter (public listing passes ACTIVE,
   * the admin listing passes undefined to see everything), paginated.
   */
  async list(
    status: CatalogStatus | undefined,
    pagination: IPaginationParams,
  ): Promise<{ data: IServicePlan[]; meta: ReturnType<typeof buildPaginationMeta> }> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const { count, rows } = await ServicePlan.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['price', 'ASC']],
    });

    return {
      data: plain<IServicePlan[]>(rows).map(mapPlan),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  async create(payload: IServicePlanCreation): Promise<IServicePlan> {
    const row = await ServicePlan.create(payload);
    return mapPlan(plain<IServicePlan>(row));
  }

  async update(
    id: string,
    updates: Partial<IServicePlan>,
  ): Promise<IServicePlan | null> {
    const row = await ServicePlan.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return mapPlan(plain<IServicePlan>(row));
  }

  /** Hard delete — only safe when no order ever referenced the plan. */
  async destroy(id: string): Promise<number> {
    return ServicePlan.destroy({ where: { id } });
  }
}

export default new ServicePlanRepository();
