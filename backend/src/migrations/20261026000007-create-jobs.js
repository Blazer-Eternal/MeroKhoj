'use strict';

/** Create the `jobs` table. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: false },
      employment_type: {
        type: Sequelize.ENUM(
          'FULL_TIME',
          'PART_TIME',
          'CONTRACT',
          'INTERNSHIP',
          'TEMPORARY',
          'FREELANCE',
        ),
        allowNull: false,
      },
      experience_level: {
        type: Sequelize.ENUM('ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'),
        allowNull: true,
      },
      salary_min: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      salary_max: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      salary_currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'NPR' },
      vacancies: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      education_requirement: { type: Sequelize.TEXT, allowNull: true },
      experience_requirement: { type: Sequelize.TEXT, allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      application_deadline: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM(
          'DRAFT',
          'PENDING_REVIEW',
          'PUBLISHED',
          'PAUSED',
          'CLOSED',
          'CANCELLED',
        ),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      published_at: { type: Sequelize.DATE, allowNull: true },
      closed_at: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('jobs', ['slug'], { unique: true, name: 'jobs_slug_idx' });
    await queryInterface.addIndex('jobs', ['company_id'], { name: 'jobs_company_idx' });
    await queryInterface.addIndex('jobs', ['status'], { name: 'jobs_status_idx' });
    await queryInterface.addIndex('jobs', ['employment_type'], { name: 'jobs_employment_type_idx' });
    await queryInterface.addIndex('jobs', ['experience_level'], {
      name: 'jobs_experience_level_idx',
    });
    await queryInterface.addIndex('jobs', ['location'], { name: 'jobs_location_idx' });
    await queryInterface.addIndex('jobs', ['application_deadline'], {
      name: 'jobs_application_deadline_idx',
    });
    // Supports the common "published jobs by recency" query.
    await queryInterface.addIndex('jobs', ['status', 'published_at'], {
      name: 'jobs_status_published_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jobs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobs_employment_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobs_experience_level";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobs_status";');
  },
};
