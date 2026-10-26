'use strict';

/** Create the `applications` table. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
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
      jobseeker_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      resume_url: { type: Sequelize.TEXT, allowNull: true },
      cover_letter: { type: Sequelize.TEXT, allowNull: true },
      status: {
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
        defaultValue: 'APPLIED',
      },
      source: {
        type: Sequelize.ENUM(
          'DIRECT',
          'SEARCH',
          'RECOMMENDATION',
          'REFERRAL',
          'JOB_ALERT',
          'TALENT_POOL',
        ),
        allowNull: false,
        defaultValue: 'DIRECT',
      },
      applied_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      withdrawn_at: { type: Sequelize.DATE, allowNull: true },
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

    // The critical constraint: one application per candidate per job.
    await queryInterface.addIndex('applications', ['job_id', 'jobseeker_id'], {
      unique: true,
      name: 'applications_job_jobseeker_unique',
    });
    await queryInterface.addIndex('applications', ['jobseeker_id'], {
      name: 'applications_jobseeker_idx',
    });
    await queryInterface.addIndex('applications', ['status'], {
      name: 'applications_status_idx',
    });
    await queryInterface.addIndex('applications', ['applied_at'], {
      name: 'applications_applied_at_idx',
    });
    // Supports the recruiter's "pipeline by status" dashboard query.
    await queryInterface.addIndex('applications', ['job_id', 'status'], {
      name: 'applications_job_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('applications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_source";');
  },
};
