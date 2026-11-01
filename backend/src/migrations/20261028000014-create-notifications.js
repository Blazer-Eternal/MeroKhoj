'use strict';

/**
 * Create the `notifications` table (entity 26).
 * Includes the required composite index (user_id, is_read, created_at).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
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
      type: {
        type: Sequelize.ENUM(
          'APPLICATION_STATUS',
          'INTERVIEW_SCHEDULED',
          'INTERVIEW_REMINDER',
          'NEW_MESSAGE',
          'JOB_ALERT',
          'SAVED_JOB_CLOSED',
          'COMPANY_VERIFICATION',
          'JOB_MODERATION',
          'REPORT_UPDATE',
          'PAYMENT_UPDATE',
          'SYSTEM',
        ),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      data: { type: Sequelize.JSONB, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
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

    // Serves the inbox listing and unread-badge count queries.
    await queryInterface.addIndex(
      'notifications',
      ['user_id', 'is_read', 'created_at'],
      { name: 'notifications_user_read_created_idx' },
    );
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'notifications_user_idx',
    });
    await queryInterface.addIndex('notifications', ['type'], {
      name: 'notifications_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notifications_type";',
    );
  },
};
