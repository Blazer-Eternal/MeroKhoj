'use strict';

/** Create the `saved_jobs` table (entity 24, unique per user+job). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('saved_jobs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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

    // A job can only be saved once per user.
    await queryInterface.addConstraint('saved_jobs', {
      fields: ['user_id', 'job_id'],
      type: 'unique',
      name: 'saved_jobs_user_job_unique',
    });
    await queryInterface.addIndex('saved_jobs', ['user_id', 'created_at'], {
      name: 'saved_jobs_user_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('saved_jobs');
  },
};
