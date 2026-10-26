'use strict';

/** Create the `job_skills` join table (job ↔ required skills). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_skills', {
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
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'skills', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      importance: {
        type: Sequelize.ENUM('REQUIRED', 'PREFERRED'),
        allowNull: false,
        defaultValue: 'REQUIRED',
      },
      minimum_experience: { type: Sequelize.DECIMAL(4, 1), allowNull: true },
      // job_skills has no updated_at — pure join table.
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('job_skills', ['job_id', 'skill_id'], {
      unique: true,
      name: 'job_skills_job_skill_unique',
    });
    await queryInterface.addIndex('job_skills', ['skill_id'], { name: 'job_skills_skill_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_skills');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_job_skills_importance";');
  },
};
