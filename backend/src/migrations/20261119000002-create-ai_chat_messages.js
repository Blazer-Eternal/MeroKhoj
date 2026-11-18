'use strict';

/**
 * Create the `ai_chat_messages` table (Phase 2, career assistant).
 *
 * Messages are stored flat per user (no session grouping); the service keeps
 * a rolling window of the most recent messages as conversation context.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_chat_messages', {
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
      role: {
        type: Sequelize.ENUM('user', 'assistant'),
        allowNull: false,
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      context: { type: Sequelize.JSONB, allowNull: true },
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

    // History window + per-user inbox ordering.
    await queryInterface.addIndex('ai_chat_messages', ['user_id', 'created_at'], {
      name: 'ai_chat_user_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ai_chat_messages');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_ai_chat_messages_role";',
    );
  },
};
