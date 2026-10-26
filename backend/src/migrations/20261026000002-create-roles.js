'use strict';

/** Create the `roles` table (platform-level roles, seeded once). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: {
        type: Sequelize.ENUM(
          'JOBSEEKER',
          'RECRUITER',
          'COMPANY_ADMIN',
          'MODERATOR',
          'ADMIN',
          'SUPER_ADMIN',
        ),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('roles', ['name'], { unique: true, name: 'roles_name_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_roles_name";');
  },
};
