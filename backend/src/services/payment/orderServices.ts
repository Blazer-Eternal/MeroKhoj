import { AppError, getPaginationParams, IPaginationQuery, IPaginationMeta } from '../../utils';
import { getSequelize } from '../../config';
import { IOrder, IAuthUser } from '../../interfaces';
import {
  OrderStatus,
  ORDER_STATUS_TRANSITIONS,
  CatalogStatus,
  InvoiceStatus,
  NotificationType,
} from '../../enums';
import {
  orderRepository,
  servicePlanRepository,
  companyMemberRepository,
  invoiceRepository,
} from '../../repositories';
import {
  assertCanManageCompany,
  resolveCompanyForUser,
  isPlatformAdmin,
} from '../shared/accessControl';
import { recordAuditForUser } from '../administration/auditLogServices';
import { notify } from '../notification/notificationServices';

/**
 * Order business logic (entity 34).
 *
 * Workflow rule 2: orders snapshot price/limits SERVER-SIDE at creation —
 * unit_price and currency are copied from the plan's current values and
 * every total is computed here. History is never recalculated from the
 * plan's current price, and plan deactivation only blocks NEW orders.
 */

/** Round to 2 decimal places (money). */
const round2 = (value: number): number => Math.round(value * 100) / 100;

/** MK-ORD-<base36 timestamp>-<random suffix> (fits VARCHAR(50)). */
const generateOrderNumber = (): string =>
  `MK-ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

/** INV-YYYYMM-<random> (fits VARCHAR(50)). */
const generateInvoiceNumber = (): string => {
  const ym = new Date().toISOString().slice(0, 7).replace('-', '');
  return `INV-${ym}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

/** Create an order with server-side totals snapshotted from the plan. */
export const createOrder = async (
  user: IAuthUser,
  input: {
    company_id: string;
    service_plan_id: string;
    quantity: number;
    discount_amount?: number;
    tax_amount?: number;
  },
): Promise<IOrder> => {
  // Money moves on behalf of the company — management power required.
  await assertCanManageCompany(user, input.company_id);

  const plan = await servicePlanRepository.findById(input.service_plan_id);
  if (!plan) throw AppError.notFound('Service plan not found');
  if (plan.status !== CatalogStatus.ACTIVE) {
    throw AppError.conflict('Service plan is not available for purchase');
  }

  const quantity = input.quantity;
  const unitPrice = round2(plan.price);
  const subtotal = round2(unitPrice * quantity);
  const discountAmount = round2(input.discount_amount ?? 0);
  const taxAmount = round2(input.tax_amount ?? 0);

  if (discountAmount > subtotal) {
    throw AppError.badRequest('Discount cannot exceed the subtotal');
  }
  const totalAmount = round2(subtotal - discountAmount + taxAmount);

  // Unique order number (retry on the astronomically rare collision).
  let orderNumber = generateOrderNumber();
  for (let attempt = 0; attempt < 3; attempt++) {
    const clash = await orderRepository.findByOrderNumber(orderNumber);
    if (!clash) break;
    orderNumber = generateOrderNumber();
  }

  const payload = {
    company_id: input.company_id,
    service_plan_id: plan.id,
    created_by: user.id,
    order_number: orderNumber,
    quantity,
    unit_price: unitPrice,
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    currency: plan.currency,
  };

  // Free order (total 0): payments require amount > 0, so there is no
  // payment step — confirm immediately and issue a PAID invoice in one
  // transaction. Entitlements become active right away.
  if (totalAmount === 0) {
    const sequelize = getSequelize();
    const t = await sequelize.transaction();
    try {
      const order = await orderRepository.create(
        { ...payload, status: OrderStatus.CONFIRMED },
        { transaction: t },
      );
      await invoiceRepository.create(
        {
          order_id: order.id,
          invoice_number: generateInvoiceNumber(),
          issue_date: new Date().toISOString().slice(0, 10),
          due_date: null,
          subtotal,
          tax_amount: taxAmount,
          total_amount: 0,
          status: InvoiceStatus.PAID,
        },
        { transaction: t },
      );
      await t.commit();

      await notify(
        order.created_by,
        NotificationType.PAYMENT_UPDATE,
        'Order confirmed',
        `Order ${order.order_number} is confirmed — no payment required.`,
        { order_id: order.id, order_number: order.order_number },
      );
      await recordAuditForUser(user, {
        action: 'ORDER_CREATED',
        entity_type: 'ORDER',
        entity_id: order.id,
        new_values: {
          order_number: order.order_number,
          service_plan: plan.name,
          total_amount: 0,
          auto_confirmed: true,
        },
      });
      return order;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  const order = await orderRepository.create({ ...payload, status: OrderStatus.PENDING });

  await recordAuditForUser(user, {
    action: 'ORDER_CREATED',
    entity_type: 'ORDER',
    entity_id: order.id,
    new_values: {
      order_number: order.order_number,
      service_plan: plan.name,
      total_amount: order.total_amount,
      currency: order.currency,
    },
  });

  return order;
};

/** List orders — admins see everything, employers see their companies'. */
export const listOrders = async (
  user: IAuthUser,
  query: IPaginationQuery & { status?: OrderStatus },
): Promise<{ data: IOrder[]; meta: IPaginationMeta }> => {
  const pagination = getPaginationParams(query);
  const companyIds = isPlatformAdmin(user)
    ? undefined
    : await companyMemberRepository.listCompanyIdsByUser(user.id);
  return orderRepository.list({ status: query.status }, companyIds, pagination);
};

/** Load an order the user is allowed to see (member of its company or admin). */
export const getOrder = async (user: IAuthUser, id: string): Promise<IOrder> => {
  const order = await orderRepository.findById(id);
  if (!order) throw AppError.notFound('Order not found');
  await resolveCompanyForUser(user, order.company_id);
  return order;
};

/**
 * Cancel a PENDING order. Confirmed/completed orders are financial
 * history and cannot be cancelled (they must be refunded instead).
 */
export const cancelOrder = async (user: IAuthUser, id: string): Promise<IOrder> => {
  const order = await orderRepository.findById(id);
  if (!order) throw AppError.notFound('Order not found');
  await assertCanManageCompany(user, order.company_id);

  const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(OrderStatus.CANCELLED)) {
    throw AppError.conflict(`Cannot cancel an order in status ${order.status}`);
  }

  const updated = await orderRepository.setStatus(id, OrderStatus.CANCELLED);
  if (!updated) throw AppError.notFound('Order not found');

  await recordAuditForUser(user, {
    action: 'ORDER_CANCELLED',
    entity_type: 'ORDER',
    entity_id: id,
    old_values: { status: order.status },
    new_values: { status: updated.status, order_number: updated.order_number },
  });

  return updated;
};

export const orderServices = {
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
};

export default orderServices;
