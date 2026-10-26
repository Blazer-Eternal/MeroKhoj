import { DataTypes } from 'sequelize';

/**
 * Standard timestamp column attributes, matching our migrations.
 *
 * Sequelize v6's `Model.init` types require every instance attribute (including
 * created_at/updated_at) to be declared, so we define them once here and spread
 * them into each model's attributes.
 */
export const timestampAttributes = {
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};

/** Variant for pure join tables that only track created_at. */
export const createdAtAttribute = {
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};
