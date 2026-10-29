'use strict';

/** Create the `industries` table (entity 17). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('industries', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
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

    await queryInterface.addIndex('industries', ['name'], {
      unique: true,
      name: 'industries_name_idx',
    });
    await queryInterface.addIndex('industries', ['slug'], {
      unique: true,
      name: 'industries_slug_idx',
    });
    await queryInterface.addIndex('industries', ['status'], { name: 'industries_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('industries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_industries_status";');
  },
};
