/**
 * Purchased-order lifecycle (entity 34).
 *
 * PENDING    → placed, awaiting payment (or offline confirmation)
 * CONFIRMED  → payment received / confirmed; entitlements active; invoice issued
 * CANCELLED  → abandoned before payment (terminal)
 * COMPLETED  → service delivered (terminal)
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export const ORDER_STATUSES: OrderStatus[] = Object.values(OrderStatus);

/** Allowed status transitions; enforced in the service layer. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.COMPLETED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.COMPLETED]: [],
};

/** Order states that grant the company its purchased plan entitlements. */
export const ENTITLEMENT_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.COMPLETED,
];
