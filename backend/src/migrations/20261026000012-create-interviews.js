'use strict';

/** Create the `interviews` table. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interviews', {
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
      scheduled_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      interview_type: {
        type: Sequelize.ENUM('PHONE', 'VIDEO', 'IN_PERSON', 'TECHNICAL', 'HR', 'FINAL'),
        allowNull: false,
      },
      scheduled_at: { type: Sequelize.DATE, allowNull: false },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
      location: { type: Sequelize.TEXT, allowNull: true },
      meeting_url: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM(
          'SCHEDULED',
          'CONFIRMED',
          'COMPLETED',
          'CANCELLED',
          'RESCHEDULED',
          'NO_SHOW',
        ),
        allowNull: false,
        defaultValue: 'SCHEDULED',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('interviews', ['application_id'], {
      name: 'interviews_application_idx',
    });
    await queryInterface.addIndex('interviews', ['status'], { name: 'interviews_status_idx' });
    await queryInterface.addIndex('interviews', ['scheduled_at'], {
      name: 'interviews_scheduled_at_idx',
    });
    await queryInterface.addIndex('interviews', ['scheduled_by'], {
      name: 'interviews_scheduled_by_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interviews');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_interviews_interview_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_interviews_status";');
  },
};
