'use strict';

/** Create the `user_roles` join table (users ↔ roles). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE',
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

    // A user cannot hold the same role twice.
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], {
      unique: true,
      name: 'user_roles_user_role_unique',
    });
    await queryInterface.addIndex('user_roles', ['role_id'], { name: 'user_roles_role_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_roles');
  },
};
