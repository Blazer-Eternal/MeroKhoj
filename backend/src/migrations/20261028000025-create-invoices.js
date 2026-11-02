'use strict';

/**
 * Create the `invoices` table (entity 36).
 *
 * Generated from an order's financials (snapshot of the order's
 * subtotal/tax/total — never recalculated from the plan's current price).
 * History is retained: invoices are voided, not deleted, and at most one
 * non-VOID invoice exists per order (enforced in the service layer).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
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
      invoice_number: { type: Sequelize.STRING(50), allowNull: false },
      issue_date: { type: Sequelize.DATEONLY, allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
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

    await queryInterface.addConstraint('invoices', {
      fields: ['invoice_number'],
      type: 'unique',
      name: 'invoices_invoice_number_unique',
    });
    // due_date, when present, must be >= issue_date.
    await queryInterface.addConstraint('invoices', {
      fields: ['issue_date', 'due_date'],
      type: 'check',
      name: 'invoices_due_after_issue',
      where: {
        [Sequelize.Op.or]: [
          { due_date: { [Sequelize.Op.is]: null } },
          { due_date: { [Sequelize.Op.gte]: Sequelize.col('issue_date') } },
        ],
      },
    });
    await queryInterface.addConstraint('invoices', {
      fields: ['subtotal', 'tax_amount', 'total_amount'],
      type: 'check',
      name: 'invoices_amounts_non_negative',
      where: {
        [Sequelize.Op.and]: [
          { subtotal: { [Sequelize.Op.gte]: 0 } },
          { tax_amount: { [Sequelize.Op.gte]: 0 } },
          { total_amount: { [Sequelize.Op.gte]: 0 } },
        ],
      },
    });
    await queryInterface.addIndex('invoices', ['order_id'], { name: 'invoices_order_idx' });
    await queryInterface.addIndex('invoices', ['status'], { name: 'invoices_status_idx' });
    await queryInterface.addIndex('invoices', ['issue_date'], { name: 'invoices_issue_date_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_status";');
  },
};
