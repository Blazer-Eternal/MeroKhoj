'use strict';

/**
 * Create the `interview_feedback` table (entity 22).
 * UNIQUE (interview_id, reviewer_id): one feedback per reviewer per interview.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interview_feedback', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      interview_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'interviews', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      communication_score: { type: Sequelize.INTEGER, allowNull: true },
      technical_score: { type: Sequelize.INTEGER, allowNull: true },
      cultural_fit_score: { type: Sequelize.INTEGER, allowNull: true },
      overall_score: { type: Sequelize.INTEGER, allowNull: true },
      strengths: { type: Sequelize.TEXT, allowNull: true },
      weaknesses: { type: Sequelize.TEXT, allowNull: true },
      comments: { type: Sequelize.TEXT, allowNull: true },
      recommendation: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addConstraint('interview_feedback', {
      fields: ['interview_id', 'reviewer_id'],
      type: 'unique',
      name: 'interview_feedback_unique',
    });
    await queryInterface.addIndex('interview_feedback', ['reviewer_id'], {
      name: 'interview_feedback_reviewer_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interview_feedback');
  },
};
