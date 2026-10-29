'use strict';

/** Create the `work_experiences` table (entity 14). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_experiences', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      jobseeker_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'jobseeker_profiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      company_name: { type: Sequelize.STRING(255), allowNull: false },
      job_title: { type: Sequelize.STRING(200), allowNull: false },
      employment_type: {
        type: Sequelize.ENUM(
          'FULL_TIME',
          'PART_TIME',
          'CONTRACT',
          'INTERNSHIP',
          'FREELANCE',
          'TEMPORARY',
        ),
        allowNull: false,
      },
      location: { type: Sequelize.STRING(255), allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      is_current: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      description: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('work_experiences', ['jobseeker_id'], {
      name: 'work_experiences_jobseeker_idx',
    });
    await queryInterface.addIndex('work_experiences', ['jobseeker_id', 'start_date'], {
      name: 'work_experiences_jobseeker_start_date_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('work_experiences');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_work_experiences_employment_type";',
    );
  },
};
