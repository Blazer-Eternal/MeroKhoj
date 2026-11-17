'use strict';

/** Create the `jobseeker_profile_skills` join table (candidate �+" skills). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobseeker_profile_skills', {
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
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'skills', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('jobseeker_profile_skills', ['jobseeker_id', 'skill_id'], {
      unique: true,
      name: 'jobseeker_profile_skills_unique',
    });
    await queryInterface.addIndex('jobseeker_profile_skills', ['skill_id'], {
      name: 'jobseeker_profile_skills_skill_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jobseeker_profile_skills');
  },
};
