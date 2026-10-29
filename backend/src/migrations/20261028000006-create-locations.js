'use strict';

/** Create the `locations` table (entity 18). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      country: { type: Sequelize.STRING(100), allowNull: false },
      province: { type: Sequelize.STRING(150), allowNull: true },
      district: { type: Sequelize.STRING(150), allowNull: true },
      city: { type: Sequelize.STRING(150), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      latitude: { type: Sequelize.DECIMAL(9, 6), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(9, 6), allowNull: true },
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

    await queryInterface.addIndex('locations', ['country'], { name: 'locations_country_idx' });
    await queryInterface.addIndex('locations', ['province'], { name: 'locations_province_idx' });
    await queryInterface.addIndex('locations', ['district'], { name: 'locations_district_idx' });
    await queryInterface.addIndex('locations', ['city'], { name: 'locations_city_idx' });
    await queryInterface.addIndex('locations', ['country', 'province', 'district', 'city'], {
      name: 'locations_hierarchy_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('locations');
  },
};
