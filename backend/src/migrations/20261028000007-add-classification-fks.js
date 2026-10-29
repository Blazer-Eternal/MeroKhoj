'use strict';

/**
 * Add classification references:
 *   jobs:      category_id → job_categories, industry_id → industries,
 *              location_id → locations
 *   companies: industry_id → industries
 *
 * All columns are nullable (classification is optional) and use SET NULL so
 * deleting a taxonomy entry never deletes jobs/companies.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ---- jobs -----------------------------------------------------------
    await queryInterface.addColumn('jobs', 'category_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'job_categories', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('jobs', 'industry_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'industries', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('jobs', 'location_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'locations', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('jobs', ['category_id'], { name: 'jobs_category_id_idx' });
    await queryInterface.addIndex('jobs', ['industry_id'], { name: 'jobs_industry_id_idx' });
    await queryInterface.addIndex('jobs', ['location_id'], { name: 'jobs_location_id_idx' });

    // ---- companies ------------------------------------------------------
    await queryInterface.addColumn('companies', 'industry_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'industries', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('companies', ['industry_id'], {
      name: 'companies_industry_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('companies', 'companies_industry_id_idx');
    await queryInterface.removeColumn('companies', 'industry_id');

    await queryInterface.removeIndex('jobs', 'jobs_location_id_idx');
    await queryInterface.removeColumn('jobs', 'location_id');
    await queryInterface.removeIndex('jobs', 'jobs_industry_id_idx');
    await queryInterface.removeColumn('jobs', 'industry_id');
    await queryInterface.removeIndex('jobs', 'jobs_category_id_idx');
    await queryInterface.removeColumn('jobs', 'category_id');
  },
};
