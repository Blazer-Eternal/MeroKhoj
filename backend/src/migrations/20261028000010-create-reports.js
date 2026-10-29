'use strict';

/** Create the `reports` table (entity 31). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      reported_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      entity_type: {
        type: Sequelize.ENUM('USER', 'COMPANY', 'JOB'),
        allowNull: false,
      },
      entity_id: { type: Sequelize.UUID, allowNull: false },
      reason: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      resolved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('reports', ['reported_by'], { name: 'reports_reporter_idx' });
    await queryInterface.addIndex('reports', ['entity_type', 'entity_id'], {
      name: 'reports_entity_idx',
    });
    await queryInterface.addIndex('reports', ['status'], { name: 'reports_status_idx' });
    await queryInterface.addIndex('reports', ['created_at'], { name: 'reports_created_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_entity_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_status";');
  },
};
