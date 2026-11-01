'use strict';

/** Create the `job_alerts` table (entity 25). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_alerts', {
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
      name: { type: Sequelize.STRING(150), allowNull: false },
      keywords: { type: Sequelize.STRING(500), allowNull: true },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'job_categories', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      employment_type: { type: Sequelize.STRING(50), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      frequency: {
        type: Sequelize.ENUM('DAILY', 'WEEKLY', 'INSTANT'),
        allowNull: false,
        defaultValue: 'DAILY',
      },
      last_sent_at: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('job_alerts', ['user_id', 'is_active'], {
      name: 'job_alerts_user_active_idx',
    });
    await queryInterface.addIndex('job_alerts', ['is_active', 'frequency'], {
      name: 'job_alerts_active_frequency_idx',
    });
    await queryInterface.addIndex('job_alerts', ['category_id'], {
      name: 'job_alerts_category_idx',
    });
    await queryInterface.addIndex('job_alerts', ['location_id'], {
      name: 'job_alerts_location_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_alerts');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_job_alerts_frequency";',
    );
  },
};
