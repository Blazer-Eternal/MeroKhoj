'use strict';

/**
 * Create the `users` table — the central authentication/account entity.
 * Roles live in `user_roles` (many-to-many) so one person can be both a
 * jobseeker and a recruiter.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DEACTIVATED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Unique phone, but only when present (Postgres partial index).
    await queryInterface.addIndex('users', ['phone'], {
      unique: true,
      name: 'users_phone_unique',
      where: { phone: { [Sequelize.Op.ne]: null } },
    });
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
    await queryInterface.addIndex('users', ['email'], { name: 'users_email_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
  },
};
