'use strict';

/** Create the `company_verifications` table (entity 29). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('company_verifications', {
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
      submitted_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      document_url: { type: Sequelize.TEXT, allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('company_verifications', ['company_id'], {
      name: 'company_verifications_company_idx',
    });
    await queryInterface.addIndex('company_verifications', ['status'], {
      name: 'company_verifications_status_idx',
    });
    await queryInterface.addIndex('company_verifications', ['company_id', 'submitted_at'], {
      name: 'company_verifications_company_submitted_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('company_verifications');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_company_verifications_status";',
    );
  },
};
