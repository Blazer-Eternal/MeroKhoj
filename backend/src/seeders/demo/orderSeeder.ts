import type { QueryInterface } from 'sequelize';
import { ID, ORDERS, PLAN, daysAgo, hasRows } from './seedData';

/**
 * Orders (1001-1006): two paid+completed, one confirmed free plan,
 * one free CONFIRMED (0 total), one CANCELLED after refund, one PENDING.
 */
export const seedOrders = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'orders')) {
    console.log('  • orders already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'orders',
    ORDERS.map((order) => {
      const createdAt = daysAgo(order.createdDaysAgo);
      return {
        id: ID(order.n),
        company_id: ID(order.company),
        service_plan_id: PLAN[order.plan],
        created_by: ID(order.created_by),
        order_number: order.order_number,
        quantity: 1,
        unit_price: order.unit_price,
        subtotal: order.unit_price,
        discount_amount: 0,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        currency: 'NPR',
        status: order.status,
        created_at: createdAt,
        updated_at: now,
      };
    }),
  );

  console.log(`  • seeded ${ORDERS.length} orders`);
};
