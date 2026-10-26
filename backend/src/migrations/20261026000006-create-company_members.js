'use strict';

/** Create the `company_members` join table (company ↔ user membership). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('company_members', {
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
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('OWNER', 'ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'VIEWER'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      joined_at: { type: Sequelize.DATE, allowNull: true },
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

    // A user cannot join the same company twice.
    await queryInterface.addIndex('company_members', ['company_id', 'user_id'], {
      unique: true,
      name: 'company_members_company_user_unique',
    });
    await queryInterface.addIndex('company_members', ['user_id'], {
      name: 'company_members_user_idx',
    });
    await queryInterface.addIndex('company_members', ['company_id', 'role'], {
      name: 'company_members_company_role_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('company_members');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_company_members_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_company_members_status";');
  },
};
