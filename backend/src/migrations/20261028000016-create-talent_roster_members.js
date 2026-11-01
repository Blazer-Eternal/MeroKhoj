'use strict';

/** Create the `talent_roster_members` table (entity 28, unique per roster+jobseeker). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('talent_roster_members', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      roster_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'talent_rosters', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      jobseeker_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'jobseeker_profiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      added_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
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

    // No duplicate members per roster.
    await queryInterface.addConstraint('talent_roster_members', {
      fields: ['roster_id', 'jobseeker_id'],
      type: 'unique',
      name: 'talent_roster_members_unique',
    });
    await queryInterface.addIndex('talent_roster_members', ['jobseeker_id'], {
      name: 'talent_roster_members_jobseeker_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('talent_roster_members');
  },
};
