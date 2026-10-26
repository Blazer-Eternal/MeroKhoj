'use strict';

/** Create the `jobseeker_profiles` table (1:1 with users). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobseeker_profiles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      headline: { type: Sequelize.STRING(255), allowNull: true },
      professional_summary: { type: Sequelize.TEXT, allowNull: true },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: true },
      gender: { type: Sequelize.STRING(30), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true },
      profile_photo_url: { type: Sequelize.TEXT, allowNull: true },
      expected_salary: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      availability: {
        type: Sequelize.ENUM('IMMEDIATE', 'NOTICE_PERIOD', 'NOT_AVAILABLE'),
        allowNull: true,
      },
      profile_visibility: {
        type: Sequelize.ENUM('PUBLIC', 'PRIVATE'),
        allowNull: false,
        defaultValue: 'PUBLIC',
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

    await queryInterface.addIndex('jobseeker_profiles', ['user_id'], {
      unique: true,
      name: 'jobseeker_profiles_user_idx',
    });
    await queryInterface.addIndex('jobseeker_profiles', ['city'], {
      name: 'jobseeker_profiles_city_idx',
    });
    await queryInterface.addIndex('jobseeker_profiles', ['profile_visibility'], {
      name: 'jobseeker_profiles_visibility_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jobseeker_profiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobseeker_profiles_availability";');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_jobseeker_profiles_profile_visibility";',
    );
  },
};
