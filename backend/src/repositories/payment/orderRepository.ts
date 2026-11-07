import { Op, Transaction } from 'sequelize';
import Order from '../../models/payment/orderModel';
import ServicePlan from '../../models/payment/servicePlanModel';
import { IOrder, IOrderCreation, IOrderQuery } from '../../interfaces';
import { OrderStatus, ENTITLEMENT_ORDER_STATUSES } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta, toMoney } from '../../utils';

const MONEY_FIELDS = [
  'unit_price',
  'subtotal',
  'discount_amount',
  'tax_amount',
  'total_amount',
] as const;

/** Map a row, coercing every DECIMAL money column to a JSON number. */
const mapOrder = (row: IOrder): IOrder => {
  const mapped = { ...row } as Record<string, unknown>;
  for (const field of MONEY_FIELDS) mapped[field] = toMoney(row[field]);
  return mapped as unknown as IOrder;
};

/**
 * Data-access layer for the `orders` table (entity 34).
 *
 * Orders are financial snapshots: rows are created once with the plan's
 * price at that moment and never recalculated. Status changes happen
 * through update() inside the service's transaction.
 */
class OrderRepository {
  async findById(id: string): Promise<IOrder | null> {
    const row = await Order.findByPk(id, { include: [{ model: ServicePlan, as: 'service_plan' }] });
    return row ? mapOrder(plain<IOrder>(row)) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    const row = await Order.findOne({ where: { order_number: orderNumber } });
    return row ? mapOrder(plain<IOrder>(row)) : null;
  }

  async create(
    payload: IOrderCreation,
    options?: { transaction?: Transaction },
  ): Promise<IOrder> {
    const row = await Order.create(payload, { transaction: options?.transaction });
    return mapOrder(plain<IOrder>(row));
  }

  async update(
    id: string,
    updates: Partial<IOrder>,
    options?: { transaction?: Transaction },
  ): Promise<IOrder | null> {
    const row = await Order.findByPk(id, { transaction: options?.transaction });
    if (!row) return null;
    await row.update(updates, { transaction: options?.transaction });
    return mapOrder(plain<IOrder>(row));
  }

  /**
   * Order listing. `companyIds` restricts the result to those companies
   * (employer view); omit it for the unscoped admin view.
   */
  async list(
    filters: IOrderQuery,
    companyIds: string[] | undefined,
    pagination: IPaginationParams,
  ): Promise<{ data: IOrder[]; meta: ReturnType<typeof buildPaginationMeta> }> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (companyIds) {
      if (companyIds.length === 0) {
        return { data: [], meta: buildPaginationMeta(0, pagination.page, pagination.perPage) };
      }
      where.company_id = { [Op.in]: companyIds };
    } else if (filters.company_id) {
      where.company_id = filters.company_id;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: ServicePlan, as: 'service_plan', attributes: ['id', 'name', 'status'] }],
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: plain<IOrder[]>(rows).map(mapOrder),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  /**
   * Orders that grant the company its purchased entitlements: CONFIRMED or
   * COMPLETED, joined to the plan so the caller can read job_posting_limit
   * and duration_days (expiry = created_at + duration_days).
   */
  async listEntitlementOrders(companyId: string): Promise<IOrder[]> {
    const rows = await Order.findAll({
      where: { company_id: companyId, status: { [Op.in]: ENTITLEMENT_ORDER_STATUSES } },
      include: [
        {
          model: ServicePlan,
          as: 'service_plan',
          attributes: ['id', 'name', 'job_posting_limit', 'duration_days', 'featured_jobs_limit'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    return plain<IOrder[]>(rows).map(mapOrder);
  }

  /** How many orders reference a plan — guards hard deletes (409). */
  async countByPlan(planId: string): Promise<number> {
    return Order.count({ where: { service_plan_id: planId } });
  }

  /** Move an order through its status graph (service validates first). */
  async setStatus(
    id: string,
    status: OrderStatus,
    options?: { transaction?: Transaction },
  ): Promise<IOrder | null> {
    return this.update(id, { status }, options);
  }
}

export default new OrderRepository();

