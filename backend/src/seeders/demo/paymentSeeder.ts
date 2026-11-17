import type { QueryInterface } from 'sequelize';
import { ID, PAYMENTS, daysAgo, hasRows } from './seedData';

/**
 * Payments (1011-1016): four COMPLETED, one REFUNDED row (separate row with
 * `provider_response.refund_of` pointing at the original, mirroring
 * paymentServices.refundPayment), one PENDING.
 */
export const seedPayments = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'payments')) {
    console.log('  • payments already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'payments',
    PAYMENTS.map((payment) => {
      const paidAt = payment.paidDaysAgo !== null ? daysAgo(payment.paidDaysAgo) : null;
      return {
        id: ID(payment.n),
        order_id: ID(payment.order),
        transaction_reference: payment.transaction_reference,
        provider: payment.provider,
        amount: payment.amount,
        currency: 'NPR',
        status: payment.status,
        paid_at: paidAt,
        failure_reason: payment.failure_reason,
        provider_response: JSON.stringify(
          payment.refund_of !== undefined
            ? { refund_of: ID(payment.refund_of), reason: payment.refund_reason ?? null }
            : { gateway: payment.provider, reference: payment.transaction_reference },
        ),
        created_at: paidAt ?? now,
        updated_at: paidAt ?? now,
      };
    }),
  );

  console.log(`  • seeded ${PAYMENTS.length} payments (incl. 1 refund row)`);
};
