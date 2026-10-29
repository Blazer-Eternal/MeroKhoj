'use strict';

/** Create the `educations` table (entity 13). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('educations', {
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
      institution: { type: Sequelize.STRING(255), allowNull: false },
      degree: { type: Sequelize.STRING(150), allowNull: false },
      field_of_study: { type: Sequelize.STRING(150), allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      is_current: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      grade: { type: Sequelize.STRING(50), allowNull: true },
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

    await queryInterface.addIndex('educations', ['jobseeker_id'], {
      name: 'educations_jobseeker_idx',
    });
    await queryInterface.addIndex('educations', ['jobseeker_id', 'start_date'], {
      name: 'educations_jobseeker_start_date_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('educations');
  },
};
