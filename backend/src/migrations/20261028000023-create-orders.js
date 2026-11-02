'use strict';

/**
 * Create the `orders` table (entity 34).
 *
 * Financial snapshot: unit_price/currency are copied from the service plan
 * at creation; subtotal = quantity * unit_price; total = subtotal -
 * discount_amount + tax_amount. History is never recalculated from the
 * plan's current price, and all FKs are RESTRICT so financial records
 * cannot be orphaned by deletes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      service_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'service_plans', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      order_number: { type: Sequelize.STRING(50), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'NPR' },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    await queryInterface.addConstraint('orders', {
      fields: ['order_number'],
      type: 'unique',
      name: 'orders_order_number_unique',
    });
    await queryInterface.addConstraint('orders', {
      fields: ['quantity'],
      type: 'check',
      name: 'orders_quantity_positive',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
    });
    await queryInterface.addConstraint('orders', {
      fields: ['unit_price', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount'],
      type: 'check',
      name: 'orders_amounts_non_negative',
      where: {
        [Sequelize.Op.and]: [
          { unit_price: { [Sequelize.Op.gte]: 0 } },
          { subtotal: { [Sequelize.Op.gte]: 0 } },
          { discount_amount: { [Sequelize.Op.gte]: 0 } },
          { tax_amount: { [Sequelize.Op.gte]: 0 } },
          { total_amount: { [Sequelize.Op.gte]: 0 } },
        ],
      },
    });
    await queryInterface.addIndex('orders', ['company_id'], { name: 'orders_company_idx' });
    await queryInterface.addIndex('orders', ['service_plan_id'], { name: 'orders_service_plan_idx' });
    await queryInterface.addIndex('orders', ['created_by'], { name: 'orders_creator_idx' });
    await queryInterface.addIndex('orders', ['status'], { name: 'orders_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
