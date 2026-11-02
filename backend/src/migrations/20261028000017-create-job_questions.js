'use strict';

/** Create the `job_questions` table (entity 19). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_questions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      question_text: { type: Sequelize.TEXT, allowNull: false },
      question_type: {
        type: Sequelize.ENUM(
          'SINGLE_CHOICE',
          'MULTI_CHOICE',
          'TEXT',
          'NUMBER',
          'DATE',
          'BOOLEAN',
        ),
        allowNull: false,
      },
      is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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

    await queryInterface.addIndex('job_questions', ['job_id'], {
      name: 'job_questions_job_idx',
    });
    await queryInterface.addIndex('job_questions', ['job_id', 'position'], {
      name: 'job_questions_job_position_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_questions');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_job_questions_question_type";',
    );
  },
};
