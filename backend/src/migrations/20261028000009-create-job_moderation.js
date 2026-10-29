'use strict';

/** Create the `job_moderation` table (entity 30, append-only). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_moderation', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      action: {
        type: Sequelize.ENUM('APPROVED', 'REJECTED', 'FLAGGED', 'REMOVED'),
        allowNull: false,
      },
      reason: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('job_moderation', ['job_id'], {
      name: 'job_moderation_job_idx',
    });
    await queryInterface.addIndex('job_moderation', ['reviewed_by'], {
      name: 'job_moderation_reviewer_idx',
    });
    await queryInterface.addIndex('job_moderation', ['action'], {
      name: 'job_moderation_action_idx',
    });
    await queryInterface.addIndex('job_moderation', ['job_id', 'created_at'], {
      name: 'job_moderation_job_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_moderation');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_job_moderation_action";');
  },
};
