'use strict';

/**
 * Create the `service_plans` table (entity 33).
 *
 * Admin-managed purchasable packages. Deactivating a plan (status flip)
 * never rewrites previously purchased orders — those carry price/limit
 * snapshots of their own.
 *
 * Constraints:
 *   price >= 0, duration_days > 0 (when set), job_posting_limit >= 0
 *   (NULL = unlimited postings), featured_jobs_limit >= 0.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_plans', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'NPR' },
      duration_days: { type: Sequelize.INTEGER, allowNull: true },
      job_posting_limit: { type: Sequelize.INTEGER, allowNull: true },
      featured_jobs_limit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
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

    await queryInterface.addConstraint('service_plans', {
      fields: ['price'],
      type: 'check',
      name: 'service_plans_price_non_negative',
      where: { price: { [Sequelize.Op.gte]: 0 } },
    });
    await queryInterface.addConstraint('service_plans', {
      fields: ['duration_days'],
      type: 'check',
      name: 'service_plans_duration_positive',
      where: { duration_days: { [Sequelize.Op.gt]: 0 } },
    });
    await queryInterface.addConstraint('service_plans', {
      fields: ['job_posting_limit'],
      type: 'check',
      name: 'service_plans_job_limit_non_negative',
      where: { job_posting_limit: { [Sequelize.Op.gte]: 0 } },
    });
    await queryInterface.addConstraint('service_plans', {
      fields: ['featured_jobs_limit'],
      type: 'check',
      name: 'service_plans_featured_limit_non_negative',
      where: { featured_jobs_limit: { [Sequelize.Op.gte]: 0 } },
    });
    await queryInterface.addIndex('service_plans', ['status'], {
      name: 'service_plans_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_plans');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_service_plans_status";',
    );
  },
};
