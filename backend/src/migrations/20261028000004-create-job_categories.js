'use strict';

/** Create the `job_categories` table (entity 16, self-referential hierarchy). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_categories', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'job_categories', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
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

    await queryInterface.addIndex('job_categories', ['slug'], {
      unique: true,
      name: 'job_categories_slug_idx',
    });
    await queryInterface.addIndex('job_categories', ['parent_id'], {
      name: 'job_categories_parent_idx',
    });
    await queryInterface.addIndex('job_categories', ['status'], {
      name: 'job_categories_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_categories');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_job_categories_status";');
  },
};
