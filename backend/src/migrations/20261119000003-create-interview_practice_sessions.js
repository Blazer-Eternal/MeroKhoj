'use strict';

/** Create the `interview_practice_sessions` table (Phase 2, interview prep). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interview_practice_sessions', {
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
      job_title: { type: Sequelize.STRING(150), allowNull: false },
      industry: { type: Sequelize.STRING(100), allowNull: true },
      skills: { type: Sequelize.JSONB, allowNull: true },
      question_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
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

    await queryInterface.addIndex('interview_practice_sessions', ['user_id'], {
      name: 'interview_sessions_user_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interview_practice_sessions');
  },
};
