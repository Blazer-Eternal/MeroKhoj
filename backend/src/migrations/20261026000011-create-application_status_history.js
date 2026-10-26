'use strict';

/** Create the `application_status_history` table (append-only audit trail). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('application_status_history', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      old_status: {
        type: Sequelize.ENUM(
          'APPLIED',
          'UNDER_REVIEW',
          'SHORTLISTED',
          'INTERVIEW',
          'SELECTED',
          'HIRED',
          'REJECTED',
          'WITHDRAWN',
        ),
        allowNull: true,
      },
      new_status: {
        type: Sequelize.ENUM(
          'APPLIED',
          'UNDER_REVIEW',
          'SHORTLISTED',
          'INTERVIEW',
          'SELECTED',
          'HIRED',
          'REJECTED',
          'WITHDRAWN',
        ),
        allowNull: false,
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      reason: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('application_status_history', ['application_id', 'created_at'], {
      name: 'application_status_history_app_created_idx',
    });
    await queryInterface.addIndex('application_status_history', ['new_status'], {
      name: 'application_status_history_new_status_idx',
    });
    await queryInterface.addIndex('application_status_history', ['changed_by'], {
      name: 'application_status_history_changed_by_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('application_status_history');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_application_status_history_old_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_application_status_history_new_status";',
    );
  },
};
