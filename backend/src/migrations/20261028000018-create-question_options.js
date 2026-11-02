'use strict';

/** Create the `question_options` table (entity 20, unique per question+text). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('question_options', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      question_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'job_questions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      option_text: { type: Sequelize.STRING(500), allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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

    // No duplicate options within a question.
    await queryInterface.addConstraint('question_options', {
      fields: ['question_id', 'option_text'],
      type: 'unique',
      name: 'question_options_unique',
    });
    await queryInterface.addIndex('question_options', ['question_id', 'position'], {
      name: 'question_options_question_position_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('question_options');
  },
};
