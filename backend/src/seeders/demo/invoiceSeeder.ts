import type { QueryInterface } from 'sequelize';
import { ID, INVOICES, dateDaysAgo, daysAgo, hasRows } from './seedData';

/**
 * Invoices (1021-1026): PAID for settled orders, VOID after the refund,
 * DRAFT for the pending order; the free order has a null due_date.
 */
export const seedInvoices = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'invoices')) {
    console.log('  • invoices already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'invoices',
    INVOICES.map((invoice) => ({
      id: ID(invoice.n),
      order_id: ID(invoice.order),
      invoice_number: invoice.invoice_number,
      issue_date: dateDaysAgo(invoice.issueDaysAgo),
      due_date:
        invoice.dueInDays === null
          ? null
          : new Date(
              daysAgo(invoice.issueDaysAgo).getTime() + invoice.dueInDays * 86_400_000,
            )
              .toISOString()
              .slice(0, 10),
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      status: invoice.status,
      created_at: daysAgo(invoice.issueDaysAgo),
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${INVOICES.length} invoices`);
};
