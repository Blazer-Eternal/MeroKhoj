'use strict';

/** Create the `resumes` table (entity 15). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resumes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      jobseeker_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'jobseeker_profiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(150), allowNull: false },
      file_url: { type: Sequelize.TEXT, allowNull: false },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_type: { type: Sequelize.STRING(100), allowNull: false },
      file_size_bytes: { type: Sequelize.BIGINT, allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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

    await queryInterface.addIndex('resumes', ['jobseeker_id'], { name: 'resumes_jobseeker_idx' });
    // Partial unique index: at most one default resume per jobseeker.
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS resumes_one_default_per_jobseeker
       ON resumes (jobseeker_id) WHERE is_default = TRUE;`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS resumes_one_default_per_jobseeker;',
    );
    await queryInterface.dropTable('resumes');
  },
};
