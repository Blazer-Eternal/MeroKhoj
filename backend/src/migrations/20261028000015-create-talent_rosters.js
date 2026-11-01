'use strict';

/** Create the `talent_rosters` table (entity 27). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('talent_rosters', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex('talent_rosters', ['company_id'], {
      name: 'talent_rosters_company_idx',
    });
    // Roster names are unique within a company.
    await queryInterface.addConstraint('talent_rosters', {
      fields: ['company_id', 'name'],
      type: 'unique',
      name: 'talent_rosters_company_name_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('talent_rosters');
  },
};
