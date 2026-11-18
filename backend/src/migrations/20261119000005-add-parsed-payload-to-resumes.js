'use strict';

/** Phase 2: store the AI-parsed resume payload on `resumes`. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('resumes', 'parsed_payload', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('resumes', 'parsed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('resumes', 'parsed_at');
    await queryInterface.removeColumn('resumes', 'parsed_payload');
  },
};
