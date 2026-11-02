'use strict';

/**
 * Create the `application_answers` table (entity 21).
 * Typed columns mirror the question type; UNIQUE (application_id, question_id)
 * guarantees one answer per question.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('application_answers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      question_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'job_questions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      answer_text: { type: Sequelize.TEXT, allowNull: true },
      answer_number: { type: Sequelize.DOUBLE, allowNull: true },
      answer_boolean: { type: Sequelize.BOOLEAN, allowNull: true },
      answer_date: { type: Sequelize.DATEONLY, allowNull: true },
      selected_option_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'question_options', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // JSONB array of selected option ids for MULTI_CHOICE questions.
      selected_option_ids: { type: Sequelize.JSONB, allowNull: true },
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

    // One answer per question per application.
    await queryInterface.addConstraint('application_answers', {
      fields: ['application_id', 'question_id'],
      type: 'unique',
      name: 'application_answers_unique',
    });
    await queryInterface.addIndex('application_answers', ['question_id'], {
      name: 'application_answers_question_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('application_answers');
  },
};
