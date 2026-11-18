'use strict';

/**
 * Create the `job_embeddings` table (Phase 2, semantic search).
 *
 * pgvector is not available on this deployment, so embeddings are stored as
 * a native REAL[] column and ranked by cosine similarity in application
 * code. The repository that touches this table is isolated so a later
 * switch to a pgvector `vector(1536)` column is a contained change.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_embeddings', {
      job_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      embedding: { type: Sequelize.ARRAY(Sequelize.REAL), allowNull: false },
      model: { type: Sequelize.STRING(100), allowNull: false },
      dimensions: { type: Sequelize.INTEGER, allowNull: false },
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

    // Freshness checks for the embed:jobs backfill script.
    await queryInterface.addIndex('job_embeddings', ['updated_at'], {
      name: 'job_embeddings_updated_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_embeddings');
  },
};
