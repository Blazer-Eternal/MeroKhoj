'use strict';

/** Create the `skills` table (reusable skill catalog). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skills', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
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

    await queryInterface.addIndex('skills', ['name'], {
      unique: true,
      name: 'skills_name_idx',
    });
    await queryInterface.addIndex('skills', ['status'], { name: 'skills_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('skills');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_skills_status";');
  },
};
