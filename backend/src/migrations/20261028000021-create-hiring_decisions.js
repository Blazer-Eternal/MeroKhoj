'use strict';

/**
 * Create the `hiring_decisions` table (entity 23).
 * UNIQUE (application_id): exactly one current decision per application.
 * Historical decisions are preserved via audit_logs.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hiring_decisions', {
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
      decided_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      outcome: {
        type: Sequelize.ENUM('HIRED', 'REJECTED', 'ON_HOLD', 'SHORTLISTED'),
        allowNull: false,
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
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

    // Exactly one current decision per application.
    await queryInterface.addConstraint('hiring_decisions', {
      fields: ['application_id'],
      type: 'unique',
      name: 'hiring_decisions_application_unique',
    });
    await queryInterface.addIndex('hiring_decisions', ['decided_by'], {
      name: 'hiring_decisions_decider_idx',
    });
    await queryInterface.addIndex('hiring_decisions', ['outcome'], {
      name: 'hiring_decisions_outcome_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hiring_decisions');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_hiring_decisions_outcome";',
    );
  },
};
