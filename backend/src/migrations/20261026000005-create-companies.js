'use strict';

/** Create the `companies` table. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      logo_url: { type: Sequelize.TEXT, allowNull: true },
      website: { type: Sequelize.STRING(500), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      industry: { type: Sequelize.STRING(150), allowNull: true },
      company_size: {
        type: Sequelize.ENUM('SOLO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'),
        allowNull: true,
      },
      address: { type: Sequelize.TEXT, allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'Nepal' },
      verification_status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
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

    await queryInterface.addIndex('companies', ['slug'], {
      unique: true,
      name: 'companies_slug_idx',
    });
    await queryInterface.addIndex('companies', ['verification_status'], {
      name: 'companies_verification_status_idx',
    });
    await queryInterface.addIndex('companies', ['status'], { name: 'companies_status_idx' });
    await queryInterface.addIndex('companies', ['city'], { name: 'companies_city_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('companies');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_companies_company_size";');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_companies_verification_status";',
    );
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_companies_status";');
  },
};
