'use strict';

/**
 * Create the `payments` table (entity 35).
 *
 * One row per transaction event. `transaction_reference` is UNIQUE only
 * when present (Postgres partial index) so repeated provider callbacks
 * resolve to the same row — the basis of idempotent webhook handling.
 *
 * Refunds are recorded as SEPARATE rows (status REFUNDED) whose
 * provider_response.refund_of points at the original transaction; the
 * original payment row is never deleted or overwritten.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      transaction_reference: { type: Sequelize.STRING(255), allowNull: true },
      provider: { type: Sequelize.STRING(50), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'NPR' },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      failure_reason: { type: Sequelize.TEXT, allowNull: true },
      provider_response: { type: Sequelize.JSONB, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('payments', {
      fields: ['amount'],
      type: 'check',
      name: 'payments_amount_positive',
      where: { amount: { [Sequelize.Op.gt]: 0 } },
    });
    // Idempotency: unique reference, but only when one is present.
    await queryInterface.addIndex('payments', ['transaction_reference'], {
      unique: true,
      name: 'payments_transaction_reference_unique',
      where: { transaction_reference: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex('payments', ['order_id'], { name: 'payments_order_idx' });
    await queryInterface.addIndex('payments', ['status'], { name: 'payments_status_idx' });
    await queryInterface.addIndex('payments', ['provider'], { name: 'payments_provider_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_payments_status";',
    );
  },
};
