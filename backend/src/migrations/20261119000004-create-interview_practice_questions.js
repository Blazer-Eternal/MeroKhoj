'use strict';

/** Create the `interview_practice_questions` table (Phase 2, interview prep). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interview_practice_questions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'interview_practice_sessions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      category: { type: Sequelize.STRING(100), allowNull: true },
      question: { type: Sequelize.TEXT, allowNull: false },
      answer: { type: Sequelize.TEXT, allowNull: true },
      score: { type: Sequelize.INTEGER, allowNull: true },
      feedback: { type: Sequelize.JSONB, allowNull: true },
      answered_at: { type: Sequelize.DATE, allowNull: true },
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

    // Session question ordering.
    await queryInterface.addIndex('interview_practice_questions', ['session_id', 'sort_order'], {
      name: 'interview_questions_session_order_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interview_practice_questions');
  },
};
